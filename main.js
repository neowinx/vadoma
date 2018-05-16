const pristineConfig = require('./config');
const overrides = require('./overrides');

const config = overrides(pristineConfig);

const requestPromise = require('request-promise');
const moment = require('moment');
const base64 = require('js-base64').Base64;
const chalk = require('chalk');

const stashMode = process && process.argv && process.argv.length > 0 && process.argv.slice(2).includes("stash");

const sharepointHeader = {
    'Authorization': `Basic ${base64.encode(`${config.sharepoint.username}:${config.sharepoint.password}`)}`,
    'Accept': 'application/json;odata=verbose'
};

const elasticHeader = {
    'Authorization': `Basic ${base64.encode(`${config.elastic.username}:${config.elastic.password}`)}`
};

async function processData(url, fieldsData) {
    if(!url) {
        url = `${config.sharepoint.url}/_api/Web/Lists/GetByTitle('${config.sharepoint.list}')/Items`
    }

    try {

        let body = await requestPromise({
            url: url, 
            headers: sharepointHeader,
            json: true
        });

        if(body && body.d && body.d.results && body.d.results.length > 0) {

            if(process && process.argv && process.argv.length > 0 && process.argv.slice(2).includes("repeat")) {
                console.log('Results found. Importing...');
                body.d.results.forEach(e => {
                    console.log(e);
                });
            }

            // Elasticsearch doesn't get along wiht Array data, so the results are splitted and sended using the _bulk API

            var bulkData = '';

            body.d.results.forEach(result => {
                bulkData += `{ "index" : { } }\n`;
                bulkData += `${JSON.stringify(result)}\n`; 
            });

            bulkData;

            requestPromise({
                url: `${config.elastic.url}/${config.elastic.index}/doc/_bulk`,
                method: 'POST',
                headers: { 'Authorization': elasticHeader['Authorization'], 'Content-type' : 'application/x-ndjson' },
                body: bulkData
            }).then( () => {
                // If the request was successful and we are in stash mode, get the new lastDate of every config.stash.field
                if(stashMode) {
                    body.d.results.forEach(result => {
                        fieldsData.forEach(data => {
                            if(moment(data.lastDate).isBefore(moment(result[data.field]))) {
                                data.lastDate = result[data.field];
                            }
                        });
                    });
                }
            });
    
            if(body.d.__next) {
                let nextUrl = body.d.__next;
                console.log(`processing next page ${chalk.yellow(nextUrl)}`);
                processData(nextUrl);
            }
        }

    } catch(e) {
        console.log(e);
    }
}

function pad(number) {
    let str = '' + number;
    let pad = '00';
  return pad.substring(0, pad.length - str.length) + str;
}

console.log(`Welcome to ${chalk.cyan('Vadoma')}`);
console.log('Starting the import process...');

async function main() {
    
    if(process && process.argv && process.argv.length > 0 && process.argv.slice(2).includes("recreate")) {
        console.log(`${chalk.yellow('WARNING:')} Recreating index as per user request. THIS CANNOT BE UNDONE!`);
        
        console.log(`${chalk.cyan('Deleting')} index ${chalk.yellow(config.elastic.index)}...`);
        await requestPromise({
            method: 'DELETE',
            url: `${config.elastic.url}/${config.elastic.index}`, 
            headers: elasticHeader
        });

        console.log(`${chalk.cyan('Creating')} index ${chalk.yellow(config.elastic.index)}...`);
        await requestPromise({ method: 'PUT',
            url: `${config.elastic.url}/${config.elastic.index}`,
            headers: elasticHeader,
            body: { settings: { analysis: { analyzer: { folding: { tokenizer: 'standard', filter: [ 'lowercase', 'asciifolding' ] } } } } },
        json: true });

        if(config.mappingData) {
            console.log(`Adding ${chalk.cyan('_mapping')} info to ${chalk.yellow('doc')} type from ${chalk.yellow('mappingData')}...`);
            await requestPromise({ method: 'POST',
            url: `${config.elastic.url}/${config.elastic.index}/_mapping/doc`,
            headers: elasticHeader,
            body: config.mappingData,
        json: true });
        }
    }

    if(stashMode) {
        console.log(`Entering ${chalk.yellow('stash')} mode.`);

        console.log(`Getting latest index data for ${config.elastic.index} index...`);

        let fieldsData = await Promise.all(config.stash.fields.split(",").map(async fieldName => { 
            let body = await requestPromise({
                url: `${config.elastic.url}/${config.elastic.index}/_search`, 
                headers: elasticHeader,
                qs: 
                {
                    _source_include: `${fieldName}`,
                    sort: `${fieldName}:desc`
                },
                json: true
            });
            return { field: fieldName, lastDate: body.hits.hits[0]._source[fieldName] }; 
        }));

        console.log(`Consulting for new data in ${config.sharepoint.list} list every ${chalk.cyan(config.stash.timeout)} milliseconds...`);
        setInterval(function() {
            fieldsData.forEach(data => {
                processData(`${config.sharepoint.url}/_api/Web/Lists/GetByTitle('${config.sharepoint.list}')/Items?$filter=${data.field}+ge+datetime'${data.lastDate}'`, fieldsData);
            });
        },  config.stash.timeout);
    } else {
        processData();
    }
}

main();
const config = require('./config');
const requestPromise = require('request-promise');
const base64 = require('js-base64').Base64;
const chalk = require('chalk');

const sharepointHeader = {
    'Authorization': `Basic ${base64.encode(`${config.sharepoint.username}:${config.sharepoint.password}`)}`,
    'Accept': 'application/json;odata=verbose'
};

const elasticHeader = {
    'Authorization': `Basic ${base64.encode(`${config.elastic.username}:${config.elastic.password}`)}`
};

async function processData(url) {
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

            requestPromise({
                url: config.elastic.url,
                method: 'POST',
                headers: elasticHeader,
                json: true,
                body: body
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

if(process && process.argv && process.argv.length > 0 && process.argv.slice(2).includes("stash")) {
    console.log(`Entering ${chalk.yellow('stash')} mode.`);
    console.log(`Consulting for new data in ${config.sharepoint.list} list every ${chalk.cyan(config.stash.timeout)} milliseconds...`);
    let d = new Date();
    setInterval(function() {
        processData(`${config.sharepoint.url}/_api/Web/Lists/GetByTitle('${config.sharepoint.list}')/Items?$filter=${config.stash.field}+ge+datetime'${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00Z'`);
    },  config.stash.timeout);
} else {
    processData();
}

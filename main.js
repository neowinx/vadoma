const pristineConfig = require('./config');
const overrides = require('./overrides');
const config = overrides(pristineConfig);

const requestPromise = require('request-promise');
const moment = require('moment');
const base64 = require('js-base64').Base64;
const chalk = require('chalk');

const sharepoint = require('./sharepoint');
const elastic = require('./elastic');

const sharepointHeader = {
    'Authorization': `Basic ${base64.encode(`${config.sharepoint.username}:${config.sharepoint.password}`)}`,
    'Accept': 'application/json;odata=verbose'
};

const elasticHeader = {
    'Authorization': `Basic ${base64.encode(`${config.elastic.username}:${config.elastic.password}`)}`
};

let stashMode = process && process.argv && process.argv.length > 0 && process.argv.slice(2).includes("stash");

let coalesceLists = {};

// pre-process the coalesce lists before the import
if(config.coalesce) {
  console.log(`Coalesce configuration found. Precaching lists data...`);
  let coalesceConfig = Array.isArray(config.coalesce) ? config.coalesce : JSON.parse(config.coalesce);
  coalesceConfig.forEach(coalesceConf => {
    coalesceLists[coalesceConf.list] = [];
    let url = coalesceConf.url ? coalesceConf.url : config.sharepoint.url;
    let username = coalesceConf.username ? coalesceConf.username : config.sharepoint.username;
    let password = coalesceConf.password ? coalesceConf.password : config.sharepoint.password;
    let header = {
      'Authorization': `Basic ${base64.encode(`${username}:${password}`)}`,
      'Accept': 'application/json;odata=verbose'
    };

    sharepoint.traverse(
      `${url}/_api/Web/Lists/GetByTitle('${coalesceConf.list}')/Items`,
      header,
      body => {
        coalesceLists[coalesceConf.list] = coalesceLists[coalesceConf.list].concat(body.d.results);
      });
  });
}

async function main() {
    
    if(process && process.argv && process.argv.length > 0 && process.argv.slice(2).includes("recreate")) {
      await elastic.recreateIndex(elasticHeader);
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
            }).catch(e => {
                console.log(`Error getting the latest date from field: ${chalk.yellow(fieldName)} for ${chalk.cyan(config.elastic.index)} index. You should probably import some data first?`);
            });
            if(body && body.hits && body.hits.hits) {
                return { field: fieldName, lastDate: body.hits.hits[0]._source[fieldName] };
            } else {
                console.warn(`WARNING: The ${chalk.yellow('lastDate')} will be established with the ${chalk.cyan('current date')}`);
                return { field: fieldName, lastDate: moment().toISOString() };
            }
        }));

        console.log(`Consulting for new data in ${config.sharepoint.list} list every ${chalk.cyan(config.stash.timeout)} milliseconds...`);
        setInterval(async function() {
          var filters = '';
          fieldsData.forEach(data => {
              filters += `${data.field}+gt+datetime'${data.lastDate}'+or+`;
          });
          filters = filters.slice(0,-4);
          sharepoint.traverse(
            `${config.sharepoint.url}/_api/Web/Lists/GetByTitle('${config.sharepoint.list}')/Items?$filter=${filters}`,
            sharepointHeader,
            body => { elastic.receive(body, elasticHeader, stashMode, coalesceLists, fieldsData) } );
        },  config.stash.timeout);
    } else {
      sharepoint.traverse(`${config.sharepoint.url}/_api/Web/Lists/GetByTitle('${config.sharepoint.list}')/Items`, sharepointHeader, body => {
          elastic.receive(body, elasticHeader, stashMode, coalesceLists)
      });
    }
}

console.log(`Welcome to ${chalk.cyan('Vadoma')}`);
console.log('Starting the import process...');

main();
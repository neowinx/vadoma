const pristineConfig = require('./config');
const overrides = require('./overrides');
const config = overrides(pristineConfig);
const requestPromise = require('request-promise');
const chalk = require('chalk');
const moment = require('moment');

async function receiveFromSharepoint(body, elasticHeader, stashMode, coalesceLists, fieldsData) {
  console.log(`Results found. Indexing IDs: ${body.d.results.map(e => { return e.ID; })}`);

  if(process && process.argv && process.argv.length > 0 && process.argv.slice(2).includes("repeat")) {
    console.log('Results found. Importing...');
    body.d.results.forEach(e => {
      console.log(e);
    });
  }

  // Elasticsearch doesn't get along wiht Array data, so the results are splitted and send using the _bulk API
  var bulkData = '';

  // The coalesce config in order to join information from other lists in sharepoint
  let coalesceConfig;
  if(config.coalesce){
    coalesceConfig = Array.isArray(config.coalesce) ? config.coalesce : JSON.parse(config.coalesce);
  }

  body.d.results.forEach(result => {

    if(coalesceConfig && coalesceLists) {
      coalesceConfig.forEach(cc => {
        let coalesceData = coalesceLists[cc.list].find(coalesceItem => {
          return coalesceItem[cc.joinOrigin] === result[cc.joinTarget]
        });
        if(coalesceData) {
          result[`${cc.list}.${cc.field}`] = coalesceData[cc.field];
        } else if(cc.addNull) {
          result[`${cc.list}.${cc.field}`] = null;
        }
      });
    }

    bulkData += `{ "index" : { "_id" : ${result.ID} } }\n`;
    bulkData += `${JSON.stringify(result)}\n`;
  });

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
}

async function recreateIndex(elasticHeader) {
  console.log(`${chalk.yellow('WARNING:')} Recreating index as per user request. THIS CANNOT BE UNDONE!`);

  console.log(`${chalk.cyan('Deleting')} index ${chalk.yellow(config.elastic.index)}...`);
  await requestPromise({
    method: 'DELETE',
    url: `${config.elastic.url}/${config.elastic.index}`,
    headers: elasticHeader
  }).catch(e => {
    console.log(`Error deleting index. It is probably that it doesn't exist in the elastic search repo. Ignoring in the meantime...`);
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

module.exports = {};
module.exports.receive = receiveFromSharepoint;
module.exports.recreateIndex = recreateIndex;
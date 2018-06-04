const pristineConfig = require('./config');
const overrides = require('./overrides');
const config = overrides(pristineConfig);
const requestPromise = require('request-promise');
const chalk = require('chalk');

async function traverseSharepoint(
  url = `${config.sharepoint.url}/_api/Web/Lists/GetByTitle('${config.sharepoint.list}')/Items`,
  headers,
  callback
) {
  try {

    let body = await requestPromise({
      url: url,
      headers: headers,
      json: true
    }).catch(e => {
      console.log(`Error requesting results. We will continuing trying though. ${e}`);
    });

    if(body && body.d && body.d.results && body.d.results.length > 0) {

      if(callback) {
        callback(body);
      }

      if(body.d.__next) {
        let nextUrl = body.d.__next;
        console.log(`processing next page ${chalk.yellow(nextUrl)}`);
        traverseSharepoint(nextUrl, headers, callback);
      }
    }

  } catch(e) {
    console.log(e);
  }
}

module.exports = {};
module.exports.traverse = traverseSharepoint;
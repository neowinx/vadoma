const config = require('./config');
const rp = require('request-promise');
const base64 = require('js-base64').Base64;
const chalk = require('chalk');

async function getProcessedData(url) {

    if(!url) {
        url = `${config.siteUrl}/_api/Web/Lists/GetByTitle('${config.list}')/Items`
    }

    let body = await rp({
        url: url, 
        headers: {
            'Authorization': `Basic ${base64.encode(`${config.username}:${config.password}`)}`,
            'Accept': 'application/json;odata=verbose'
        }
    });

    console.log(body);

}

console.log(`Welcome to ${chalk.green('Vadoma')}`);
console.log('Starting the import process...');

getProcessedData();
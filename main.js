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
        console.log(`Processing page ${chalk.yellow(url)}`);
    }

    try {

        let body = await requestPromise({
            url: url, 
            headers: sharepointHeader,
            json: true
        });

        requestPromise({
            url: config.elastic.url,
            method: 'POST',
            headers: elasticHeader,
            json: true,
            body: body
        });

        if(body && body.d && body.d.__next) {
            let nextUrl = body.d.__next;
            console.log(`processing next page ${chalk.yellow(nextUrl)}`);
            processData(nextUrl);
        }

    } catch(e) {
        console.log(e);
    }
}

console.log(`Welcome to ${chalk.cyan('Vadoma')}`);
console.log('Starting the import process...');

processData();
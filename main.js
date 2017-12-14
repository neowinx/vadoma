const config = require('./config');
const rp = require('request-promise');
const base64 = require('js-base64').Base64;
const chalk = require('chalk');

async function processData(url) {
    if(!url) {
        url = `${config.sharepoint.url}/_api/Web/Lists/GetByTitle('${config.sharepoint.list}')/Items`
        console.log(`Processing page ${chalk.yellow(url)}`);
    }

    try {

        let body = await rp({
            url: url, 
            headers: {
                'Authorization': `Basic ${base64.encode(`${config.sharepoint.username}:${config.sharepoint.password}`)}`,
                'Accept': 'application/json;odata=verbose'
            },
            json: true
        });

        rp({
            url: `${config.elastic.url}/${config.elastic.index}/${config.elastic.type}`,
            method: 'POST',
            headers: {
                'Authorization': `Basic ${base64.encode(`${config.elastic.username}:${config.elastic.password}`)}`
            },
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

console.log(`Process finished. Have a nice day ${chalk.green(':D')}`);
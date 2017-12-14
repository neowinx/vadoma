# Vadoma

**Vadoma, a simple node app to import lists from Sharepoint (versions around 2013) to Elasticsearch (versions around 6.0.x)**

## Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js v8](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/neowinx/vadoma.git
# Go into the repository
cd vadoma
# Install dependencies
npm install
# Edit settings in **config.json**
nano config.json
# Run the app
npm start
```

## Configuration

The config.json is (as you may have guessed) a straightforward json file with this content:

```json
{
  "sharepoint" : {
    "url" : "http://sharepoint.example.org:8080",
    "username" : "sharepoint@example.org",
    "password" : "Password@Example.org",
    "list" : "MyList"
  },
  "elastic" : {
    "url" : "http://localhost:9200/myindex/doc",
    "username" : "elastic",
    "password" : "changeme"
  }
}
```

- **sharepoint.url** : The url of the endpoint of your sharepoint api
- **sharepoint.username** : The username for basic authentication on your sharepoint
- **sharepoint.password** : The password for basic authentication on your sharepoint
- **sharepoint.list** : The name of the sharepoint list you want to import
- **elastic.url** : The url of your elasticsearch endpoint to use for the import (must include the index and type)
- **elastic.username** : The username of your elasticsearch for authentication
- **elastic.password** : The password of your elasticsearch for authentication

## License

[CC0 1.0 (Public Domain)](LICENSE.md)

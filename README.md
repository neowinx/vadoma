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

And it will start the import right away (**I mean it**, it will start as soon as you press enter... ok?... ok)

## `Stash` mode

`Vadoma` can also check periodically for new items in the list. To do so, just especify in the corresponding configuration a datetime field used to check for new items comparing the current date and then start `vadoma` in `stash` mode:

```bash
npm start stash
```

## Configuration

The _config.json_ is (as you may have guessed) a straightforward json file with this content:

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
  },
  "stash" : {
    "field" : "Created",
    "timeout" : 15000
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
- **stash.field** : Used for the `stash` mode. The Datetime field used to check for new items in the list
- **stash.timeout** : Used for the `stash` mode. The time used for the interval to check for new items in the list

### Environment variables

Every configuration has its corresponding environment variable override. It follows the format where every word has been upercased and the dots replaced by underscores i.e.: my.config <==> MY_CONFIG.

So the list of variables that replaces its corresponding configuration is:

| SHAREPOINT_URL      	| sharepoint.url      	|
|---------------------	|---------------------	|
| SHAREPOINT_USERNAME 	| sharepoint.username 	|
| SHAREPOINT_PASSWORD 	| sharepoint.password 	|
| SHAREPOINT_LIST     	| sharepoint.list     	|
| ELASTIC_URL         	| elastic.url         	|
| ELASTIC_USERNAME    	| elastic.username    	|
| ELASTIC_PASSWORD    	| elastic.password    	|
| STASH_FIELD         	| stash.field         	|
| STASH_TIMEOUT       	| stash.timeout       	|

## FAQ

### Why you have created this?

I couldn't find a suitable logstash plugin to do the import of and entire list from _Sharepoint_ to _Elasticsearch_ and it was easier for me to create something like this

### WTF Vadoma means?

Supposedly *Vadoma* was in the common gypsy names list, so I found adequate to name something that serves to migrate stuff with a gypsy name

### I dont like this it is ugly, inefficient and it is not programmed in my super awesome language because blablabla...

Just don't use it... and let others live

## License

[CC0 1.0 (Public Domain)](LICENSE.md)

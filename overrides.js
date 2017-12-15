let overrides = function(config) {
    return {
        "sharepoint" : {
            "url" : process.env.SHAREPOINT_URL || config.sharepoint.url,
            "username" : process.env.SHAREPOINT_USERNAME || config.sharepoint.username,
            "password" : process.env.SHAREPOINT_PASSWORD || config.sharepoint.password,
            "list" : process.env.SHAREPOINT_LIST || config.sharepoint.list
          },
          "elastic" : {
            "url" : process.env.ELASTIC_URL || config.elastic.url,
            "username" : process.env.ELASTIC_USERNAME || config.elastic.username,
            "password" : process.env.ELASTIC_PASSWORD || config.elastic.password
          },
          "stash" : {
            "field" : process.env.STASH_FIELD || config.stash.field,
            "timeout" : process.env.STASH_TIMEOUT || config.stash.timeout
          }
    };
}

module.exports = overrides;
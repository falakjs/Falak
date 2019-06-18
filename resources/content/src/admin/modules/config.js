Config.extend({
    http: {
        endpoint: {
            baseUrl: '',
            apiKey: '', // api key if required i.e Authorization: key {some-key}, add only the key without the `key` word
            baseRoute: '', // base route that will be added at the end of the base url
        }
    },
    user: {
        loginKey: '_u',
        accessTokenKey: '_at',
    }
});
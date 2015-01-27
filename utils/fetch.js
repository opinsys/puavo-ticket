"use strict";

var axios = require("axios");
var Promise = require("bluebird");

var defaultOptions = {
    headers: {}
};

function fetch(options) {
    options = Object.assign({}, defaultOptions, options);
    var csrfToken = fetch.getCsrfToken();
    if (!csrfToken) {
        throw new Error("Cannot find window.CSRF_TOKEN");
    }

    // Always add csrfToken header
    options.headers["x-csrf-token"] = csrfToken;

    return Promise.resolve(axios(options));
}

["get", "put", "post", "delete"].forEach(function(method) {
    fetch[method] = function(url, data, options) {
        options = options || {};
        if (data) options.data = data;
        if (url) options.url = url;
        return fetch(Object.assign({}, options, {method: method}));
    };
});

fetch.getCsrfToken = function() {
    return window.CSRF_TOKEN;
};

module.exports = fetch;

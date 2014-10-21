"use strict";

var axios = require("axios");
var Promise = require("bluebird");
var _ = require("lodash");

var csrfToken = window.CSRF_TOKEN;
if (!csrfToken) {
    throw new Error("Cannot find window.CSRF_TOKEN");
}

var defaultOptions = {
    headers: {}
};

function fetch(options) {
    options = _.extend({}, defaultOptions, options);

    // Always add csrfToken header
    options.headers["x-csrf-token"] = csrfToken;

    return Promise.resolve(axios(options));
}

["get", "put", "post", "delete"].forEach(function(method) {
    fetch[method] = function(url, data, options) {
        options = options || {};
        if (data) options.data = data;
        if (url) options.url = url;
        return fetch(_.extend({}, options, {method: method}));
    };
});

fetch.getCsrfToken = function() {
    return csrfToken;
};

module.exports = fetch;

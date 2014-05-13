"use strict";

var Promise = require("bluebird");
var request = Promise.promisify(require("request"));

function Puavo(options) {

    this.domain = options.domain;
}

Puavo.prototype.request = function(url) {
    // FIXME: authentication
    return request("https://" + this.domain + url)
        .then(function(contents) {
            return JSON.parse(contents[1]);
        });
};


Puavo.prototype.userByUsername = function(username) {
    return this.request("/v3/users/" + username);

};

module.exports = Puavo;

"use strict";

var Promise = require("bluebird");
var request = Promise.promisify(require("request"));
var config = require("../config.js");

function Puavo(options) {

    this.domain = options.domain;
}

Puavo.prototype.request = function(url) {
    return request(config.puavo.protocol + this.domain + url, {
        'auth': {
            'user': config.puavo.organisations[this.domain].user,
            'pass': config.puavo.organisations[this.domain].password
        }
        })
        .spread(function(res, body) {
            return JSON.parse(body);
        });

};


Puavo.prototype.userByUsername = function(username) {
    return this.request("/v3/users/" + username);

};

module.exports = Puavo;

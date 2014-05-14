"use strict";

var Promise = require("bluebird");
var request = Promise.promisify(require("request"));
var config = require("../config.js");

/**
 * Client library for puavo-rest
 *
 * @namespace utils
 * @class Puavo
 */
function Puavo(options) {

    this.domain = options.domain;
}

/**
 * Create request to the puavo-rest with authentication by organisation
 *
 * @method request
 * @param {String} url
 * @return {Object}
 */
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

/**
 * Get user information by username from the puavo-rest
 *
 * @method userByUsername
 * @param {String} username
 * @return {Object}
 */
Puavo.prototype.userByUsername = function(username) {
    return this.request("/v3/users/" + username);

};

module.exports = Puavo;

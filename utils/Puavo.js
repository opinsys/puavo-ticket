"use strict";

var url = require("url");
var Promise = require("bluebird");
var request = Promise.promisify(require("request"));
var config = require("../config.js");

/**
 * Client library for puavo-rest
 *
 * @namespace utils
 * @class Puavo
 *
 * @constructor
 * @param {Object} options
 * @param {Object} options.domain
 */
function Puavo(options) {
    this.domain = options.domain;
}

/**
 * Create request to the puavo-rest with authentication by organisation
 *
 * @method request
 * @param {String} pathname
 * @return {Bluebird.Promise}
 */
Puavo.prototype.request = function(pathname) {

    var puavoUrl = url.format({
        protocol: url.parse(config.puavo.restServerAddress).protocol,
        host: url.parse(config.puavo.restServerAddress).host,
        pathname: pathname,
    });

    return request(puavoUrl, {
            auth: {
                'user': config.puavo.username,
                'pass': config.puavo.password
            },
            headers: {
                host: this.domain
            }
        })
        .spread(function(res, body) {
            return JSON.parse(body);
        });

};

/**
 * Get user information by username from the puavo-rest
 *
 * @method fetchUserByUsername
 * @param {String} username
 * @return {Bluebird.Promise}
 */
Puavo.prototype.fetchUserByUsername = function(username) {
    return this.request("/v3/users/" + username);
};

module.exports = Puavo;

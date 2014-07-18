"use strict";

var Promise = require("bluebird");

var Request = require("superagent").Request;

/**
 * @namespace utils
 * @class Superagent
 */

/**
 *
 * Add promise support for superagent/supertest
 *
 * Call .promise() to return promise for the request
 *
 * This is pretty much shit. The superagent version must be kept in sync with
 * node_modules/supertest/package.json
 *
 * @method promise
 * @return {Bluebird.Promise}
 */
Request.prototype.promise = function() {
    var self = this;
    return new Promise(function(resolve, reject){
        Request.prototype.end.call(self, function(err, res) {
            if (err) return reject(err);
            if (res.status === 500) {
                return reject(new Error(res.text));
            }
            resolve(res);
        });
    });
};

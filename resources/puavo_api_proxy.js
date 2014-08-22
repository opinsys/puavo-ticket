"use strict";
var debug = require("debug")("puavo-ticket:resources/puavo_api_proxy");
var url = require("url");
var express = require("express");
var request = require("request");
var promisePipe = require("promisepipe");
var _ = require("lodash");

var config;

var app = express.Router();



var puavoURL = {
    isProfileImage: function(path) {
        return /^\/v3\/users\/[^\/]+\/profile\.jpg$/.test(path);
    }
};


/**
 *
 *
 * @api {get} /api/puavo/* Proxy GET requests to api.opinsys.fi
 * @apiName ApiProxy
 * @apiGroup puavo_api
 * @apiDescription
 *      Uses organisation of the user as the domain
 *
 *      See https://github.com/opinsys/puavo-users/blob/master/rest/doc/ROUTES.md
 * @apiExample As user of testing.opisys.fi request to https://testing.opinsys.fi/v3/users can be made as
 *      GET /api/puavo/v3/users
 */
app.all("/:domain*", function(req, res, next) {

    function proxyPass(targetURL) {
        debug("Proxying request to %s %s", req.method, targetURL);
        promisePipe(
            request({
                method: req.method,
                headers: _.extend({}, req.headers, {
                    // Fix request domain for the current organisation
                    host: domain,

                    // Try to workaround the referer check on puavo-rest
                    // http://rubydoc.info/github/rkh/rack-protection/Rack/Protection/JsonCsrf
                    referer: domain
                }),
                url: targetURL,
                pool: {},
                form: req.body,
                auth: {
                    "user": config.puavo.username,
                    "pass": config.puavo.password
                },
                // XXX: How to use our cert auth?
                strictSSL: false
            }),
            res
        ).catch(function(err) {
            console.error("Proxy connection to puavo-rest failed. Tried GET", targetURL, "with forced Host header:", domain);
            next(err);
        });
    }

    // puavo-ticket users can only read data from puavo.
    if (req.method !== "GET") {
        return res.status(401).json({
            error: "Only GET requests are allowed for puavo requests"
        });
    }

    var userDomain = req.user.get("externalData").organisation_domain;
    var domain = req.params.domain;

    var targetSearch =  url.parse(req.url).search; // querystring
    var targetPath = req.params[0];

    var targetURL = url.format({
        protocol: url.parse(config.puavo.restServerAddress).protocol,
        host: url.parse(config.puavo.restServerAddress).host,
        pathname: targetPath,
        search: targetSearch
    });

    // Allow proxying if the user is accessing his own organisation
    if (userDomain === domain) {
        return proxyPass(targetURL);
    }

    // Allow access to profile images of other organisations
    if (puavoURL.isProfileImage(targetPath)) {
        return proxyPass(targetURL);
    }

    // Managers can access everything
    if (req.user.isManager()) {
        return proxyPass(targetURL);
    }

    // Otherwise deny
    return res.status(401).json({
        error: "Cannot access other organisations"
    });

});


module.exports = function(_config) {
    config = _config;
    return app;
};

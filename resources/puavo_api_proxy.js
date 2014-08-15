"use strict";
var debug = require("debug")("puavo-ticket:resources/puavo_api_proxy");
var url = require("url");
var express = require("express");
var request = require("request");
var promisePipe = require("promisepipe");
var _ = require("lodash");

var config;

var app = express.Router();


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

    // puavo-ticket users can only read data from puavo.
    if (req.method !== "GET") {
        return res.status(401).json({
            error: "Only GET requests are allowed for puavo requests"
        });
    }

    var userDomain = req.user.get("externalData").organisation_domain;
    var domain = req.params.domain;

    // Only managers can access other organisations
    if (userDomain !== domain && !req.user.isManager()) {
        console.error("Non manager access denied to", req.url, "for", req.user.getDomainUsername());
        return res.status(401).json({
            error: "Cannot access other organisations"
        });
    }

    var u =  url.parse(req.url);

    var puavoUrl = url.format({
        protocol: url.parse(config.puavo.restServerAddress).protocol,
        host: url.parse(config.puavo.restServerAddress).host,
        pathname: req.params[0],
        search: u.search
    });

    debug("Proxying request to %s %s", req.method, puavoUrl);


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
            url: puavoUrl,
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
        console.error("Proxy connection to puavo-rest failed. Tried GET", puavoUrl, "with forced Host header:", domain);
        next(err);
    });
});

module.exports = function(_config) {
    config = _config;
    return app;
};

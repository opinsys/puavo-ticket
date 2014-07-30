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
app.use(function(req, res, next) {

    // puavo-ticket users can only read data from puavo.
    if (req.method !== "GET") {
        return res.json(401, {
            error: "Only GET requests are allowed for puavo requests"
        });
    }

    var u =  url.parse(req.url);

    var puavoUrl = url.format({
        protocol: url.parse(config.puavo.restServerAddress).protocol,
        host: url.parse(config.puavo.restServerAddress).host,
        pathname: u.pathname,
        search: u.search
    });

    debug("Proxying request to %s %s", req.method, puavoUrl);

    var domain = req.user.get("externalData").organisation_domain;

    promisePipe(
        request({
            method: "GET",
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
                'user': config.puavo.username,
                'pass': config.puavo.password
            },
            // XXX: How to use our cert auth?
            strictSSL: false
        }),
        res
    ).catch(next);
});

module.exports = function(_config) {
    config = _config;
    return app;
};

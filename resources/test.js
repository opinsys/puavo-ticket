"use strict";
/**
 * Resource endpoint testing that everything is working as expected
 * */

var db = require("../db");

var User = require("app/models/server/User");
var Puavo = require("../utils/Puavo");

var express = require("express");
var app = express();

app.get("/test", function(req, res, next) {

    var result = {
        postgresql: false,
        puavo: false,
        knexPoolStats: db.knex.client.pool.stats()
    };

    User.forge({})
    .query(q => q.limit(1).whereNotNull("externalId"))
    .fetch({ require: true })
    .then(u => {
        if (!u) throw new Error("Failed to find user from postgresql");

        result.postgresql = !!u;
        var puavo = new Puavo({
            domain: u.get("externalData").organisation_domain,
            timeout: 1000 * 20
        });
        return puavo.request("/v3/about");
    })
    .then(puavoData => {
        if (!puavoData) {
            throw new Error("Cannot find data from puavo");
        }

        result.puavo = !!puavoData;
        res.json(result);
    })
    .catch(err => {
        result.error = err.message;
        res.status(500).json(result);
    });

});

/*
 * Manual error for testing for errors :)
 * */
app.get("/test_error", function(req, res, next) {
    next(new Error("You asked for it! Here's an error!"));
});

module.exports = app;

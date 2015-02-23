"use strict";
/**
 * Resource endpoint testing that everything is working as expected
 * */

var User = require("app/models/server/User");
var Puavo = require("../utils/Puavo");

var express = require("express");
var app = express();

app.get("/test", function(req, res, next) {

    var result = {
        postgresql: false,
        puavo: false,
    };

    User.forge({})
    .query(q => q.limit(1).whereNotNull("externalId"))
    .fetch({ require: true })
    .then(u => {
        if (!u) throw new Error("Failed to find user from postgresql");

        result.postgresql = !!u;
        var puavo = new Puavo({ domain: u.get("externalData").organisation_domain });
        return puavo.fetchUserByUsername(u.get("externalData").username);
    })
    .then(puavoData => {
        if (!puavoData) {
            throw new Error("Cannot find data from puavo");
        }

        result.puavo = !!puavoData;
        res.json(result);
    })
    .catch(err => {
        result.error = err;
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

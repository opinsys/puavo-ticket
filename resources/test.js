"use strict";

var User = require("app/models/server/User");
var Puavo = require("../utils/Puavo");

var express = require("express");
var app = express();

app.get("/api/test", function(req, res, next) {

    var result = {
        postgresql: false,
        puavo: false,
    };

    User.collection()
    .query(q => q.limit(1))
    .fetch({ require: true })
    .then(c => c.first())
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
    .catch(next);

});

module.exports = app;

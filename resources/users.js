"use strict";

var express = require("express");

var User = require("app/models/server/User");

var app = express.Router();

/**
 * Puavo-ticket does not itself handle any users. Use puavo-rest APIs with the
 * puavo_api_proxy. This resource is used to synchronize single user from the
 * puavo-rest to local puavo-ticket database
 */
app.post("/api/users", function(req, res, next) {
    User.ensureUserByUsername(req.body.username, req.body.domain)
    .then(function(user) {
        res.json(user);
    })
    .catch(next);
});


module.exports = app;

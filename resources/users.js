"use strict";

var express = require("express");

var User = require("app/models/server/User");
var Acl = require("../models/Acl");

var app = express.Router();


app.get("/api/users/:id", function(req, res, next) {
    User.byId(req.params.id).fetch({
        require: true,
        withRelated: "accessTags"
    })
    .then(u => res.json(u))
    .catch(next);
});


app.post("/api/users/:userId/access_tags", function(req, res, next) {

    if (!req.user.acl.canEditAccessTags()) {
        return next(new Acl.PermissionDeniedError());
    }

    if (!req.body.accessTag) {
        return next(new Error("body.accessTag is missing"));
    }

    User.byId(req.params.userId).fetch({
        require: true,
        withRelated: "accessTags"
    })
    .then(user => user.addAccessTag(req.body.accessTag, req.user))
    .then(tag => res.json(tag))
    .catch(next);

});


/**
 * Puavo-ticket does not itself handle any users. Use puavo-rest APIs with the
 * puavo_api_proxy. This resource is used to synchronize single user from the
 * puavo-rest to local puavo-ticket database
 */
app.post("/api/users", function(req, res, next) {
    User.ensureUserByUsername(req.body.username, req.body.domain)
    .tap(u => u.load("accessTags"))
    .then(function(user) {
        res.json(user);
    })
    .catch(next);
});


module.exports = app;

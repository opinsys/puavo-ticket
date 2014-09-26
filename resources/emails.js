"use strict";
var express = require("express");
var debug = require("debug")("app:resources/emails");

var config = require("app/config");
var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");

var app = express.Router();

app.post("/api/send_emails", function(req, res, next) {

    if (req.body.secret !== config.emailJobSecret) {
        return res.status(403).json({ error: "permission denied" });
    }

    User.collection().fetch()
    .then(function(coll) {
        debug("Going to search for emails for %s users", coll.length);
        return coll.models;
    })
    .map(function(user) {
        if (!user.getEmail()) {
            debug(
                "Warning! User %s has no email address",
                user.getDomainUsername()
             );
             return;
        }

        return Ticket.withUnreadComments(user, { byEmail: true }).fetch({
            withRelated: "titles"
        }).then(function(coll) {
            debug(
                "Sending email updates for %s about %s tickets",
                user.getDomainUsername(), coll.length
            );
            return coll.models;
        })
        .map(function(ticket) {
            return ticket.sendBufferedEmailNotifications(user);
        });
    })
    .then(function() {
        res.json({ ok: true });
    })
    .catch(next);
});


module.exports = app;
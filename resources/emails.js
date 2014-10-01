"use strict";
var express = require("express");
var debug = require("debug")("app:email");
var prettyMs = require("pretty-ms");
var parseOneAddress = require("email-addresses").parseOneAddress;

var config = require("app/config");
var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");

var app = express.Router();

function sendEmails(req, res, next) {

    if (req.body.secret !== config.emailJobSecret) {
        return res.status(403).json({ error: "permission denied" });
    }
    var started = Date.now();

    User.collection().fetch()
    .then(function(coll) {
        debug("Going to search for emails for %s users", coll.length);
        return coll.models;
    })
    .map(function(user) {
        if (!user.getEmail()) {
             return;
        }

        return Ticket.withUnreadComments(user, { byEmail: true }).fetch({
            withRelated: "titles"
        }).then(function(coll) {
            return coll.models;
        })
        .map(function(ticket) {
            return ticket.sendBufferedEmailNotifications(user);
        });
    })
    .then(function() {
        var duration = Date.now() - started;

        debug("emails processed in %s", prettyMs(duration));
        res.json({
            ok: true,
            duration: duration,
            durationPretty: prettyMs(duration),
        });
    })
    .catch(next);
}

app.post("/api/send_emails", function(req, res, next) {
    console.log("Call to deprecated /api/send_emails");
    sendEmails(req, res, next);
});
app.post("/api/emails/send", sendEmails);


app.post("/api/emails/new", function(req, res, next) {
    var userOb = parseOneAddress(req.body.from);
    var firstName = "";
    var lastName = userOb.name;
    var title = req.body.subject;
    var description = req.body["stripped-text"];

    User.ensureUserByEmail(req.body.sender, firstName, lastName)
    .then(function(user) {
        return Ticket.create(title, description, user)
        .then(function(ticket) {
            res.json({
                userId: user.get("id"),
                ticketId: ticket.get("id")
            });
        });
    })
    .catch(next);
});

app.post("/api/emails/reply", function(req, res, next) {
    res.status(501).end("not implemented");
});

module.exports = app;

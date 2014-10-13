"use strict";

var express = require("express");
var Promise = require("bluebird");

var Ticket = require("../models/server/Ticket");
var User = require("../models/server/User");

var app = express.Router();


/**
 * @api {post} /api/tickets/:id/handlers Add follower to a ticket
 * @apiName AddHandlers
 * @apiGroup handlers
 *
 * @apiParam {String} username Username for the handler
 */
app.post("/api/tickets/:id/handlers", function(req, res, next) {
    if (!req.user.isManager()) {
        return res.status(403).json({ error: "permission denied" });
    }

    Promise.all([
        User.ensureUserByUsername(req.body.username, req.body.organisation_domain),
        Ticket.fetchByIdConstrained(req.user, req.params.id)
    ])
    .spread(function(handler, ticket) {
        return ticket.addHandler(handler, req.user);
    })
    .then(function(handler) {
        return handler.load(["createdBy", "handler"]);
    })
    .then(function(handler) {
        res.json(handler);
    })
    .catch(next);
});

app.delete("/api/tickets/:id/handlers/:userId", function(req, res, next) {
    if (!req.user.isManager()) {
        return res.status(403).json({ error: "permission denied" });
    }

    Ticket.collection()
    .query({ where: { id: req.params.id }})
    .byUserVisibilities(req.user)
    .fetch({
        require: true,
        withRelated: [
            {handlers: function(q) {
                q.where({
                    handler: req.params.userId,
                    deleted: 0
                });
            }}
        ]
    })
    .then(function(tickets) {
        var ticket = tickets.first();
        var handler = ticket.relations.handlers.first();
        return handler.softDelete(req.user).return(handler);
    })
    .then(function(handler) {
        res.json(handler);
    })
    .catch(next);


});


module.exports = app;

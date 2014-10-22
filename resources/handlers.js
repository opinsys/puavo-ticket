"use strict";

var express = require("express");

var Ticket = require("../models/server/Ticket");
var User = require("../models/server/User");
var Acl = require("../models/Acl");

var app = express.Router();


/**
 * @api {post} /api/tickets/:id/handlers Add follower to a ticket
 * @apiName AddHandlers
 * @apiGroup handlers
 *
 * @apiParam {String} username Username for the handler
 */
app.post("/api/tickets/:id/handlers", function(req, res, next) {

    Ticket.fetchByIdConstrained(req.user, req.params.id)
    .then(function(ticket) {
        if (!req.user.acl.canEditHandlers(ticket)) {
            throw new Acl.PermissionDeniedError();
        }
        return User.ensureUserByUsername(
            req.body.username,
            req.body.organisation_domain
         ).then(function(handlerUser) {
            return ticket.addHandler(handlerUser, req.user);
         });
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
    Ticket.collection()
    .query({ where: { "tickets.id": req.params.id }})
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
        if (tickets.size() > 1) {
            throw new Error("found extra tickets wtf?");
        }
        var ticket = tickets.first();
        if (!req.user.acl.canEditHandlers(ticket)) {
            throw new Acl.PermissionDeniedError();
        }
        var handler = ticket.relations.handlers.first();
        return handler.softDelete(req.user).return(handler);
    })
    .then(function(handler) {
        res.json(handler);
    })
    .catch(next);


});


module.exports = app;

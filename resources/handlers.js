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

    Ticket.byId(req.params.id).fetch({require:true})
    .then((ticket) => {
        if (!req.user.acl.canEditHandlers(ticket)) {
            throw new Acl.PermissionDeniedError();
        }

        return ticket.removeHandler(req.params.userId, req.user);
    })
    .then((handler) => res.json(handler))
    .catch(next);

});


module.exports = app;

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
    Promise.all([
        User.ensureUserByUsername(req.body.username, req.body.organisation_domain),
        Ticket.byId(req.params.id).fetch({ require: true })
    ])
    .spread(function(handler, ticket) {
        return ticket.addHandler(handler, req.user);
    })
    .then(function(handler) {
        res.json(handler);
    })
    .catch(next);
});


module.exports = app;

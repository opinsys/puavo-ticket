"use strict";

var express = require("express");

var Ticket = require("../models/server/Ticket");

var app = express.Router();


/**
 * @api {post} /api/tickets/:id/handlers Add follower to a ticket
 * @apiName AddHandlers
 * @apiGroup handlers
 *
 * @apiParam {String} id User id for the handler
 */
app.post("/api/tickets/:id/handlers", function(req, res, next) {
    Ticket.byId(req.params.id).fetch({ require: true })
    .then(function(ticket) {
        return ticket.addHandler(req.body.id, req.user);
    })
    .then(res.json.bind(res))
    .catch(next);
});

module.exports = app;

"use strict";

var express = require("express");

var Ticket = require("../models/server/Ticket");

var app = express.Router();


/**
 * @api {post} /api/tickets/:id/handlers Add follower to a ticket
 * @apiName AddHandlers
 * @apiGroup handlers
 */
app.post("/api/tickets/:id/handlers", function(req, res, next) {
    Ticket.forge({ id: req.params.id })
    .fetch()
    .then(function(ticket) {
        if (!ticket) return res.json(404, { error: "no such ticket" });
        return ticket.addHandler(req.body.id, req.user)
            .then(function(handler) {
                res.json(handler.toJSON());
            });
    })
    .catch(next);
});

module.exports = app;

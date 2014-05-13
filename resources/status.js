
"use strict";

var express = require("express");

var Ticket = require("../models/server/Ticket");

var app = express.Router();


/**
 * @api {put} /api/tickets/:id/handlers Set status to a ticket
 * @apiName SetStatus
 * @apiGroup status
 *
 * @apiParam {String} status
 */
app.put("/api/tickets/:id/status", function(req, res, next) {
    Ticket.forge({ id: req.params.id })
    .fetch()
    .then(function(ticket) {
        if (!ticket) return res.json(404, { error: "no such ticket" });
        return ticket.setStatus(req.body.status, req.user)
            .then(function(foo) {
                res.json(foo.toJSON());
            });
    })
    .catch(next);
});

module.exports = app;

"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var express = require("express");

var Ticket = require("../models/server/Ticket");

var app = express.Router();


/**
 * @api {post} /api/tickets/:id/read Mark ticket as read
 * @apiName CreateReadTicket
 * @apiGroup read_tickets
 */
app.post("/api/tickets/:id/read", function(req, res, next) {
    Ticket.forge({ id: req.params.id })
    .fetch()
    .then(function(ticket) {
        if (!ticket) return res.json(404, { error: "no such ticket" });
        return ticket.markAsRead(req.user);
    })
    .then(function() {
        res.json({ ok: true });
    })
    .catch(next);
});

module.exports = app;
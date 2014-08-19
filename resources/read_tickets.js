"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var debug = require("debug")("puavo-ticket:resources/read_tickets");
var express = require("express");

var Ticket = require("../models/server/Ticket");
var app = express.Router();


/**
 * @api {post} /api/tickets/:id/read Mark ticket as read
 * @apiName CreateReadTicket
 * @apiGroup readTickets
 */
app.post("/api/tickets/:id/read", function(req, res, next) {
    debug(
        "Marking ticket %s as read for %s",
        req.params.id,
        req.user.get("externalData").domain_username
    );

    Ticket.fetchByIdConstrained(req.user, req.params.id)
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

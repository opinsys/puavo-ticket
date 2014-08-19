"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var express = require("express");

var Ticket = require("../models/server/Ticket");

var app = express.Router();


/**
 * @api {post} /api/tickets/:id/devices Add device to a ticket
 * @apiName CreateDevice
 * @apiGroup devices
 *
 * @apiParam {String} hostname
 */
app.post("/api/tickets/:id/devices", function(req, res, next) {
    Ticket.fetchByIdConstrained(req.user, req.params.id)
    .then(function(ticket) {
        if (!ticket) return res.json(404, { error: "no such ticket" });
        return ticket.addDevice(req.body.hostname, req.user);
    })
    .then(function(device) {
        res.json(device.toJSON());
    })
    .catch(next);
});

module.exports = app;

"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var express = require("express");

var Ticket = require("../models/server/Ticket");
var Device = require("../models/server/Device");

var app = express.Router();


/**
 * @api {post} /api/tickets/:id/devices Add device to a ticket
 * @apiName CreateDevice
 * @apiGroup devices
 *
 * @apiParam {String} hostname
 */
app.post("/api/tickets/:id/devices", function(req, res, next) {
    Ticket.forge({ id: req.params.id })
    .fetch()
    .then(function(ticket) {
        if (!ticket) return res.json(404, { error: "no such ticket" });
        Device.forge({
            hostname: req.body.hostname,
            ticket_id: req.params.id,
            user_id: req.user.id
        })
        .save()
        .then(function(device) {
            res.json(device.toJSON());
        });
    })
    .catch(next);
});

module.exports = app;
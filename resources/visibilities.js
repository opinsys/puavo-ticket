"use strict";

var express = require("express");
var Promise = require("bluebird");

var Ticket = require("../models/server/Ticket");

var app = express.Router();


/**
 * @api {post} /api/tickets/:id/visibilities Add visibility to a ticket
 * @apiName AddVisibilitye
 * @apiGroup visibilities
 *
 * @apiParam {Array} visibilities Array of visibilities
 */
app.post("/api/tickets/:id/visibilities", function(req, res, next) {
    Ticket.forge({ id: req.params.id })
    .fetch()
    .then(function(ticket) {
        if (!ticket) return res.json(404, { error: "no such ticket" });
        return Promise.all(req.body.visibilities.map(function(visibility) {
            return ticket.addVisibility(visibility, req.user);
        }));
    })
    .then(function(visibilities) {
        res.json(visibilities);
    })
    .catch(next);
});

module.exports = app;

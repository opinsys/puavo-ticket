
"use strict";

var express = require("express");

var Ticket = require("../models/server/Ticket");

var app = express.Router();


/**
 * @api {post} /api/tickets/:id/tags Add tag to a ticket
 * @apiName AddTag
 * @apiGroup tags
 *
 * @apiParam {String} tag
 */
app.post("/api/tickets/:id/tags", function(req, res, next) {
    Ticket.forge({ id: req.params.id })
    .fetch()
    .then(function(ticket) {
        if (!ticket) return res.json(404, { error: "no such ticket" });
        return ticket.addTag(req.body.tag, req.user)
            .then(function(tag) {
                res.json(tag.toJSON());
            });
    })
    .catch(next);
});

module.exports = app;
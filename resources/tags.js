
"use strict";

var express = require("express");
var debug = require("debug")("app:resources/tags");

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
    debug(
        "Trying to add tag %s to %s",
        req.body.tag, req.params.id
     );

    Ticket.fetchByIdConstrained(req.user, req.params.id)
    .then(function(ticket) {
        if (!ticket) return res.json(404, { error: "no such ticket" });
        return ticket.addTag(req.body.tag, req.user)
        .then(function(tag) {
            debug("tag %s ok", req.body.tag);
            res.json(tag.toJSON());
        });
    })
    .catch(next);
});

module.exports = app;

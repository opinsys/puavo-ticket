"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var express = require("express");

var Ticket = require("../models/server/Ticket");

var app = express.Router();


/**
 * @api {post} /api/tickets/:id/followers Add follower to a ticket
 * @apiName CreateFollower
 * @apiGroup followers
 */
app.post("/api/tickets/:id/followers", function(req, res, next) {
    Ticket.forge({ id: req.params.id })
    .fetch()
    .then(function(ticket) {
        if (!ticket) return res.json(404, { error: "no such ticket" });
        return ticket.addFollower({
                created_by: req.user.id
            })
            .then(function(follower) {
                res.json(follower.toJSON());
            });
    })
    .catch(next);
});

module.exports = app;

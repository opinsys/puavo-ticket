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
    Ticket.byIdWithVisibilities(req.user, req.params.id)
    .fetchOne()
    .then(function(ticket) {
        // TODO: In future we will probably need to add other users as
        // followers too, but for now we can manage with this.
        return ticket.addFollower(req.user, req.user);
    })
    .then(function(follower) {
        return follower.load(["createdBy", "follower"]);
    })
    .then(function(follower) {
        res.json(follower);
    })
    .catch(next);
});

module.exports = app;

"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var express = require("express");

var Ticket = require("../models/server/Ticket");
var RelatedUser = require("../models/server/RelatedUser");

var app = express();


/**
 * @api {post} /api/tickets/:id/related_users Add related user to ticket
 * @apiName CreateRelatedUser
 * @apiGroup related_users
 *
 * @apiParam {String} username
 * @apiParam {Integer} user_id
 */
app.post("/api/tickets/:id/related_users", function(req, res, next) {
    Ticket.forge({ id: req.params.id })
    .fetch()
    .then(function(ticket) {
        if (!ticket) return res.json(404, { error: "no such ticket" });
        RelatedUser.forge({
            user_id: req.body.user_id,
            username: req.body.username,
            ticket: req.params.id
        })
        .save()
        .then(function(related_user) {
            res.json(related_user.toJSON());
        });
    })
    .catch(next);
});

module.exports = app;

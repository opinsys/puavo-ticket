"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var express = require("express");

var Ticket = require("../models/server/Ticket");
var Comment = require("../models/server/Comment");

var app = express.Router();


/**
 * @api {post} /api/tickets/:id/comments Add comment to a ticket
 * @apiName CreateComment
 * @apiGroup comments
 *
 * @apiParam {String} comment
 */
app.post("/api/tickets/:id/comments", function(req, res, next) {
    Ticket.forge({ id: req.params.id })
    .fetch()
    .then(function(ticket) {
        if (!ticket) return res.json(404, { error: "no such ticket" });
        Comment.forge({
            comment: req.body.comment,
            ticket_id: req.params.id,
            created_by: req.user.id
        })
        .save()
        .then(function(comment) {
            res.json(comment.toJSON());
        });
    })
    .catch(next);
});

/**
 * @api {get} /api/tickets/:id/comments Get comments for a ticket
 * @apiName GetComments
 * @apiGroup comments
 *
 * @apiSuccess {Object[]} . List of comments
 */
app.get("/api/tickets/:id/comments", function(req, res, next) {
    Comment.collection()
    .query('where', 'ticket_id', '=', req.params.id)
    .fetch()
    .then(function(collection) {
        res.json(collection.toJSON());
    })
    .catch(next);
});

module.exports = app;

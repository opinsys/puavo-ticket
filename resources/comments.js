"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var express = require("express");

var Ticket = require("../models/server/Ticket");

var app = express.Router();


/**
 * @api {post} /api/tickets/:id/comments Add comment to a ticket
 * @apiName CreateComment
 * @apiGroup comments
 *
 * @apiParam {String} comment
 */
app.post("/api/tickets/:id/comments", function(req, res, next) {
    Ticket.fetchByIdConstrained(req.user, req.params.id)
    .then(function(ticket) {
        return ticket.addComment(req.body.comment, req.user);
    })
    .then(function(comment) {
        res.json(comment);
    })
    .catch(next);
});


module.exports = app;

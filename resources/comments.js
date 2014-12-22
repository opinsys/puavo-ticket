"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var Promise = require("bluebird");
var express = require("express");

var Ticket = require("../models/server/Ticket");
var Comment = require("../models/server/Comment");
var Acl = require("../models/Acl");

var app = express.Router();


/**
 * @api {post} /api/tickets/:id/comments Add comment to a ticket
 * @apiName CreateComment
 * @apiGroup comments
 *
 * @apiParam {String} comment
 */
app.post("/api/tickets/:id/comments", function(req, res, next) {

    var hidden = !!req.body.hidden;
    if (hidden && !req.user.acl.canAddHiddenComments()) {
        return next(new Acl.PermissionDeniedError());
    }

    Ticket.fetchByIdConstrained(req.user, req.params.id)
    .then(function(ticket) {
        return Promise.join(
            ticket.addComment(req.body.comment, req.user, {
                hidden: hidden
            }),
            ticket
        );
    })
    .spread(function(comment, ticket) {

        if (!hidden) {
            return ticket.sendLiveNotifications(
                comment,
                req.sio
            ).return(comment);
        }

        return comment;

    })
    .then(function(comment) {
        res.json(comment);
    })
    .catch(next);
});


app.post("/api/tickets/:ticketId/comments/:commentId/visibility", function(req, res, next) {
    var hidden = !!req.body.hidden;
    if (!req.user.acl.canAddHiddenComments()) {
        return next(new Acl.PermissionDeniedError());
    }

    Comment.forge({
        ticketId: req.params.ticketId,
        id: req.params.commentId,
    })
    .fetch({ require: true, withRelated: "ticket" })
    .then(function(comment) {
        return comment.set({ hidden: hidden }).save();
    })
    .then(function(comment) {
        return comment.rel("ticket").updateTimestamp().return(comment);
    })
    .then(function(comment) {
        return res.json(comment);
    })
    .catch(next);
});

module.exports = app;

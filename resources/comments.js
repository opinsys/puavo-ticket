"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var Promise = require("bluebird");
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
        return Promise.join(
            ticket.addComment(req.body.comment, req.user),
            ticket
        );
    })
    .spread(function(comment, ticket) {

        // Intentionally do this outside of the current Promise chain.
        ticket.followers().query(function(q) {
            q.where("followedById", "!=", req.user.get("id"));
        }).fetch()
        .then(function(followers) {
            followers.forEach(function(follower) {
                console.log("sending to ", follower.getSocketIORoom());
                req.sio.sockets.to(follower.getSocketIORoom()).emit("comment", comment.toJSON());
            });
        })
        .catch(console.error);

        res.json(comment);
    })
    .catch(next);
});


module.exports = app;

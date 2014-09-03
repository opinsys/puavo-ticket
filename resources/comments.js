"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var Promise = require("bluebird");
var express = require("express");
var debug = require("debug")("puavo-ticket:live");

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

        debug("%s sending watcherUpdate to %s", req.user, ticket.get("id"));

        req.sio.sockets.to(
            ticket.getSocketIORoom()
        ).emit("watcherUpdate", {
            ticketId: ticket.get("id"),
            commentId: comment.get("id")
        });

        // Intentionally do this outside of the current Promise chain.
        ticket.followers().query(function(q) {
            q.where("followedById", "!=", req.user.get("id"));
        })
        .fetch()
        .then(function(followers) {
            return comment.load([
                "createdBy",
                "ticket",
                "ticket.titles",
            ]).return(followers);
        })
        .then(function(followers) {
            debug(
                "%s sending update to followers %s",
                req.user, followers.pluck("followedById")
            );

            return followers.models;
        })
        .each(function(follower) {
            req.sio.sockets.to(
                follower.getSocketIORoom()
            ).emit("followerUpdate", comment.toJSON());
        })
        .catch(console.error);

        res.json(comment);
    })
    .catch(next);
});


module.exports = app;

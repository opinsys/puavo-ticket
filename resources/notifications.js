"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var debug = require("debug")("app:resources/read_tickets");
var express = require("express");

var Ticket = require("../models/server/Ticket");
var app = express.Router();


/**
 * @api {post} /api/tickets/:id/read Mark ticket as read
 * @apiName CreateReadTicket
 * @apiGroup notifications
 */
app.post("/api/tickets/:id/read", function(req, res, next) {
    debug(
        "Marking ticket %s as read for %s",
        req.params.id,
        req.user.get("externalData").domain_username
    );

    Ticket.fetchByIdConstrained(req.user, req.params.id)
    .then(function(ticket) {
        if (!ticket) return res.json(404, { error: "no such ticket" });
        return ticket.markAsRead(req.user);
    })
    .then(function(notification) {
        res.json(notification);
    })
    .catch(next);
});

/**
 * @api {post} /api/notifications List tickets that have unread comment by the
 * current user. The response will only contain the latest ticket title and
 * comment
 * @apiName ListUnreadTickets
 * @apiGroup notifications
 */
app.get("/api/notifications", function(req, res, next) {
    Ticket.collection()
    .byUserVisibilities(req.user)
    .withUnreadComments(req.user)
    .fetch().then(function(coll) {
        return coll.models;
    })
    .map(function loadLatestComment(ticket) {
        // XXX: This is not very efficient as separate query is issued for
        // each ticket. See extra/latestcomments.sql for better solution
        return ticket.load([
            { titles: function(q) {
                q.orderBy("createdAt", "desc").limit(1);
            }},
            { comments: function(q) {
                q.orderBy("createdAt", "desc").limit(1);
            }},
            "comments.createdBy"
        ]);
    })
    .then(function(tickets) {
        res.json(tickets);
    })
    .catch(next);
});

module.exports = app;

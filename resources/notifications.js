"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var debug = require("debug")("app:resources/read_tickets");
var express = require("express");

var Ticket = require("../models/server/Ticket");
var db = require("../db");
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

app.post("/api/mark_all_notifications_as_read", function(req, res, next) {
    db.knex("notifications")
    .where({ targetId: req.user.get("id") })
    .update({
        readAt: new Date(),
        emailSentAt: new Date()
    })
    .then(function(count) {
        res.json({ count: count });
    })
    .catch(next);
});

app.get("/api/notifications", function(req, res, next) {
    Ticket.collection()
    .byUserVisibilities(req.user)
    .withUnreadComments(req.user)
    .query(q => q.orderBy("updatedAt", "asc"))
    .fetch({
        withRelated: [
            {comments: function(q) {

                var subQuery = db.knex
                .column(["ticketId"])
                .max("createdAt as latest")
                .from("comments")
                .where("hidden", false)
                .groupBy("ticketId");

                q.join(subQuery.as("maxtable"), function() {
                    this.on("comments.ticketId", "=", "maxtable.ticketId");
                    this.on("comments.createdAt", "=", "maxtable.latest");
                });

            }},

            "comments.createdBy",

            {titles: function(q) {

                var subQuery = db.knex
                .column(["ticketId"])
                .max("createdAt as latest")
                .from("titles")
                .groupBy("ticketId");

                q.join(subQuery.as("maxtable"), function() {
                    this.on("titles.ticketId", "=", "maxtable.ticketId");
                    this.on("titles.createdAt", "=", "maxtable.latest");
                });

            }},

        ]
    })
    .then((tickets) => tickets.models)
    .map(function(ticket) {
        var comment = ticket.rel("comments").first();
        return {
            title: "Uusi kommentti tukipyyntöön: " + ticket.rel("titles").first().get("title"),
            body: comment.get("comment"),
            createdAt: comment.get("createdAt"),
            createdBy: comment.rel("createdBy"),
            url: "/tickets/" + ticket.get("id")
        };
    })
    .then(function(notifications) {
        res.json(notifications);
    })
    .catch(next);
});

module.exports = app;

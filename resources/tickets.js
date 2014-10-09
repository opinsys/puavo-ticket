"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var express = require("express");

var Ticket = require("../models/server/Ticket");

var app = express.Router();


/**
 * @api {get} /api/tickets Get array of tickets the current user has access to
 * @apiName GetAllTicket
 * @apiGroup tickets
 *
 * @apiSuccess {Object[]} . List of tickets
 */
app.get("/api/tickets", function(req, res, next) {
    Ticket.byUserVisibilities(req.user)
    .query(function(q) {
        q.orderBy("updatedAt", "desc");

        if (req.query.someTag) {
            q.join("tags", "tickets.id", "=", "tags.ticketId");
            q.whereIn("tags.tag", req.query.someTag.split(","));
            q.whereNull("tags.deletedAt");
        }

        if (req.query.everyTag) {
            req.query.everyTag.split(",").forEach(function(tag, i) {
                // Each required tag needs it's own join...
                var ref = "t" + i;
                q.join("tags as " + ref, "tickets.id", "=", ref + ".ticketId");
                q.where(ref + ".tag", "=", tag );
                q.whereNull(ref + ".deletedAt");
            });
        }
    })
    .fetch({
        withRelated: [
            "createdBy",
            "handlers.handler",
            "tags",
            "titles",
            { notifications: function(qb) {
                qb.where({ targetId: req.user.get("id") });
            }}
        ]
    })
    .then(function(tickets) {
        res.json(tickets);
    })
    .catch(next);
});

/**
 * @api {get} /api/tickets/:id Get single ticket
 * @apiName GetTicket
 * @apiGroup tickets
 *
 * @apiSuccess {String} description Description of the ticket
 */
app.get("/api/tickets/:id", function(req, res, next) {
    Ticket.fetchByIdConstrained(req.user, req.params.id, {
        withRelated: [
            "createdBy",
            "comments.createdBy",
            "comments.attachments",
            "handlers",
            "tags.createdBy",
            "handlers.handler",
            "handlers.createdBy",
            "followers.follower",
            "titles.createdBy",
            { notifications: function(qb) {
                qb.where({ targetId: req.user.get("id") });
            }}
        ],
        require: true
    })
    .then(function(ticket) {
        res.json(ticket);
    })
    .catch(Ticket.NotFoundError, function(err) {
        res.status(404).json({ error: "not found" });
    })
    .catch(next);
});

/**
 * @api {post} /api/tickets Create ticket
 * @apiName CreateTicket
 * @apiGroup tickets
 */
app.post("/api/tickets", function(req, res, next) {
    Ticket.forge({ createdById: req.user.id })
    .save()
    .then(function(ticket) {
        res.json(ticket);
    })
    .catch(next);
});


module.exports = app;

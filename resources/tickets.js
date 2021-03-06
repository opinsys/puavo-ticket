"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var express = require("express");
var db = require("app/db");

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
    var tickets = Ticket.collection()
    .byUserVisibilities(req.user);

    var limit = 99;
    if (req.query.limit) {
        limit = parseInt(req.query.limit, 10);
    }

    tickets.query(function(q) {
        q.limit(limit);
    });

    if (req.query.offset) {
        tickets.query(function(q) {
            q.offset(parseInt(req.query.offset, 10));
        });
    }

    if (req.query.tags) {
        tickets.withTags([].concat(req.query.tags).map(tag => tag.split("|")));
    }

    if (req.query.follower) {
        tickets.withFollower(req.query.follower);
    }

    if (req.query.handler) {
        tickets.withHandler(req.query.handler);
    }

    if (req.query.text) {
        tickets.withText(req.query.text);
    }

    if (req.query.return === "count") {
        return tickets.query()
        .groupBy("tickets.id")
        .count("*")
        .then(function(coll) {
            res.json({
                count: coll.length
            });
        })
        .catch(next);
    }

    var orderBy = "updatedAt";
    var direction = "desc";
    if (req.query.orderBy) orderBy = req.query.orderBy;
    if (req.query.direction) direction = req.query.direction;

    tickets.query(function(q) {
        q.orderBy("tickets." + orderBy, direction);
    });

    tickets.fetch({
        withRelated: [
            "createdBy",
            {handlers: function(q) {
                q.where({ deleted: 0 });
            }},
            "handlers.handler",
            {comments: function(q) {

                // Create sub query for latests comment for each ticket.
                // XXX depending on how PostgreSQL optimizes this it can
                // get bit heavy at some point.
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
            "tags",
            "titles",
            {notifications: function(qb) {
                qb.where({ targetId: req.user.get("id") });
            }}
        ]
    })
    .then(function(tickets) {
        res.json(tickets);
    })
    .catch(next);
});

app.get("/api/zendesk/:id", function(req, res, next) {
    Ticket.forge({
        zendeskTicketId: req.params.id
    })
    .fetch({ require: true })
    .then(function(ticket) {
        res.redirect("/tickets/" + ticket.get("id"));
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
            {comments: function(q) {
                if (!req.user.acl.canSeeHiddenComments()) {
                    q.where({ hidden: false });
                }
            }},
            "comments.createdBy",
            "comments.attachments",
            "tags",
            "tags.createdBy",
            "handlers",
            "handlers.handler",
            "handlers.createdBy",
            "followers.follower",
            "titles",
            "titles.createdBy",
            {notifications: function(qb) {
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
    Ticket.create(
        req.body.title,
        req.body.description,
        req.user
    )
    .then(function(ticket) {
        res.json(ticket);
    })
    .catch(next);
});


module.exports = app;

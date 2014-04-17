"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var express = require("express");

var Ticket = require("../models/server/Ticket");
var Comment = require("../models/server/Comment");
var RelatedUser = require("../models/server/RelatedUser");

var app = express();


/**
 * @api {get} /api/tickets Get array of tickets the current user has access to
 * @apiName GetAllTicket
 * @apiGroup tickets
 *
 * @apiSuccess {Object[]} . List of tickets
 */
app.get("/api/tickets", function(req, res, next) {
    console.log("GET", req.url, new Date());
    Ticket.collection().fetch()
    .then(function(coll) {
        res.json(coll.toJSON());
    })
    .catch(next);
});

/**
 * @api {get} /api/tickets/:id Get single ticket
 * @apiName GetTicket
 * @apiGroup tickets
 *
 * @apiSuccess {String} title Title of the ticket
 * @apiSuccess {String} description Description of the ticket
 */
app.get("/api/tickets/:id", function(req, res, next) {
    console.log("GET", req.url, new Date());
    Ticket.forge({ id: req.params.id }).fetch()
    .then(function(ticket) {
        if (!ticket) return res.json(404, { error: "no such ticket" });
        res.json(ticket.toJSON());
    })
    .catch(next);
});

/**
 * @api {post} /api/tickets Create ticket
 * @apiName CreateTicket
 * @apiGroup tickets
 *
 * @apiParam {String} title
 * @apiParam {String} description
 */
app.post("/api/tickets", function(req, res, next) {
    Ticket.forge(req.body)
    .save()
    .then(function(ticket) {
        res.json(ticket.toJSON());
    })
    .catch(next);
});


/**
 * @api {put} /api/tickets/:id Update ticket by id
 * @apiName UpdateTicket
 * @apiGroup tickets
 *
 * @apiParam {String} title
 * @apiParam {String} description
 */
app.put("/api/tickets/:id", function(req, res, next) {
    Ticket.forge({ id: req.params.id })
    .fetch()
    .then(function(ticket) {
        if (!ticket) return res.json(404, { error: "no such ticket" });
        ticket.set(req.body);
        return ticket.save();
    })
    .then(function(ticket) {
        res.json(ticket.toJSON());
    })
    .catch(next);
});


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
            ticket: req.params.id
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
    .query('where', 'ticket', '=', req.params.id)
    .fetch()
    .then(function(collection) {
        res.json(collection.toJSON());
    })
    .catch(next);
});

app.get("/api/tickets/:id/updates", function(req, res, next) {
    var comments = null;
    var relatedUsers = null;
    Comment.collection()
    .query('where', 'ticket', '=', req.params.id)
    .fetch()
    .then(function(collection) {
        comments = collection;

        return RelatedUser.collection()
        .query('where', 'ticket', '=', req.params.id)
        .fetch()
        .then(function(collection) {
            relatedUsers = collection;
            return relatedUsers;
        });
    })
    .then(function() {
        var updates = comments.toArray().concat(relatedUsers.toArray());

        updates.sort(function(a,b) {
            if ( a.get("updated") > b.get("updated") ) {
                return 1;
            }
            if ( a.get("updated") < b.get("updated") ) {
                return -1;
            }

            return 0;

        });
        console.log(JSON.stringify(updates));
        res.json(updates);
    })
    .catch(next);
});

module.exports = app;

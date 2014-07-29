"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var express = require("express");
var DB = require("../db");

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
    var tickets;

    if (req.user.isManager()) {
        tickets = Ticket.collection();
    } else {
        tickets = Ticket.byVisibilities(req.user.getVisibilities());
    }

    tickets.fetch({
        withRelated: [
            "createdBy",
            "handlers.handler",
            "tags",
            "readTickets"
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
    var collection;

    if (req.user.isManager()) collection = Ticket.collection();
    else collection = Ticket.byVisibilities(req.user.getVisibilities());

    collection.query({ where: { "tickets.id": req.params.id }})
    .fetch({
        withRelated: [
            "createdBy",
            "comments.createdBy",
            "handlers",
            "tags.createdBy",
            "tagHistory.createdBy",
            "handlers.handler",
            "handlers.createdBy",
            "devices.createdBy",
            "relatedUsers.user",
            "relatedUsers.createdBy",
            "titles.createdBy"
        ],
        require: true
    })
    .then(function(ticket) {
        res.json(ticket.first());
    })
    .catch(DB.EmptyError, function(err) {
        res.status(404);
        res.json({ error: "not found" });
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
    Ticket.forge({
        description: req.body.description,
        createdById: req.user.id
    })
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

module.exports = app;

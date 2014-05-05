"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var express = require("express");
var Promise = require("bluebird");

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
    Ticket.fetchByVisibility(req.user.getVisibilities())
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
    // TODO: assert visibilities!
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
    Ticket.forge({
        title: req.body.title,
        description: req.body.description,
        user: req.user.id
    })
    .save()
    .then(function(ticket) {
        return Promise.all(req.user.getVisibilities().map(function(vis) {
                return ticket.addVisibility({
                    entity: vis
                });
            }))
            .then(function() {
                return ticket;
            });
    })
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
 * @api {get} /api/tickets/:id/updates Get all updates for a ticket
 * @apiName GetUpdates
 * @apiGroup updates
 *
 * @apiSuccess {Object[]} . List of updates
 */
app.get("/api/tickets/:id/updates", function(req, res, next) {
    Ticket.forge({ id: req.params.id })
    .fetch()
    .then(function(ticket) {
        return ticket.fetchUpdates();
    })
    .then(function(updates) {
        res.json(updates);
    })
    .catch(next);
});

module.exports = app;

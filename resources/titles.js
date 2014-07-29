"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var express = require("express");

var Ticket = require("../models/server/Ticket");
var Title = require("../models/server/Title");

var app = express.Router();


/**
 * @api {post} /api/tickets/:id/titles Add title to a ticket
 * @apiName CreateTitle
 * @apiGroup titles
 *
 * @apiParam {String} title
 */
app.post("/api/tickets/:id/titles", function(req, res, next) {
    Ticket.forge({ id: req.params.id })
    .fetch({ require: true })
    .then(function(ticket) {
        return ticket.addTitle(req.body.title, req.user);
    })
    .then(function(title) {
        res.json(title.toJSON());
    })
    .catch(next);
});

/**
 * @api {get} /api/tickets/:id/titles Get titles for a ticket
 * @apiName GetTitles
 * @apiGroup titles
 *
 * @apiSuccess {Object[]} . List of titles
 */
app.get("/api/tickets/:id/titles", function(req, res, next) {
    Title.collection()
    .query('where', 'ticketId', '=', req.params.id)
    .fetch()
    .then(function(collection) {
        res.json(collection.toJSON());
    })
    .catch(next);
});

module.exports = app;

"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var express = require("express");

var Ticket = require("../models/server/Ticket");

var app = express.Router();


/**
 * @api {post} /api/tickets/:id/titles Add title to a ticket
 * @apiName CreateTitle
 * @apiGroup titles
 *
 * @apiParam {String} title
 */
app.post("/api/tickets/:id/titles", function(req, res, next) {
    Ticket.fetchByIdConstrained(req.user, req.params.id)
    .then(function(ticket) {
        return ticket.addTitle(req.body.title, req.user);
    })
    .then(function(title) {
        res.json(title.toJSON());
    })
    .catch(next);
});


module.exports = app;

"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var express = require("express");
var Promise = require("bluebird");

var Ticket = require("../models/server/Ticket");
var User = require("../models/server/User");

var app = express.Router();



/**
 * @api {post} /api/tickets/:id/relatedUsers Add related user to ticket
 * @apiName CreateRelatedUser
 * @apiGroup relatedUsers
 *
 * @apiParam {String} username
 * @apiParam {String} domain
 */
app.post("/api/tickets/:id/relatedUsers", function(req, res, next) {
    Promise.all([
        Ticket.byId(req.params.id).fetch({ require: true }),
        User.ensureUserByUsername(req.body.username, req.body.domain)
    ])
    .spread(function(ticket, relatedUser) {
        return ticket.addRelatedUser(relatedUser, req.user);
    })
    .then(function(user) {
        res.json(user.toJSON());
    })
    .catch(next);
});


module.exports = app;

"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var Promise = require("bluebird");
var request = Promise.promisify(require("request"));
var express = require("express");

var Ticket = require("../models/server/Ticket");
var RelatedUser = require("../models/server/RelatedUser");
var User = require("../models/server/User");

var app = express.Router();



function clientError(e) {
    return e.code >= 400 && e.code < 500;
}


/**
 * @api {post} /api/tickets/:id/related_users Add related user to ticket
 * @apiName CreateRelatedUser
 * @apiGroup related_users
 *
 * @apiParam {String} username
 * @apiParam {Integer} id
 */
app.post("/api/tickets/:id/related_users", function(req, res, next) {
    var rTicket = null;
    Ticket.forge({ id: req.params.id })
    .fetch()
    .then(function(ticket) {
        if (!ticket) return res.json(404, { error: "no such ticket" });
        rTicket = ticket;
        return User.forge({ external_id: req.params.external_id })
            .fetch();
    })
    .then(function(user) {
        if (!user) {
            // FIXME: set url to config.json
            return request("https://testing.opinsys.fi/v3/users/joe.bloggs")
                .then(function(contents) {
                    var userData = JSON.parse(contents[1]);
                    return User.forge({
                        external_id: userData.id,
                        external_data: userData
                    }).save();
                })
                .catch(clientError, function(e){
                    console.log(e);
                });
        } else {
            return user;
        }
    })
    .then(function(user) {
        return rTicket.addRelatedUser(user.id, req.user);
    })
    .then(function(user) {
        res.json(user.toJSON());
    })
    .catch(next);
});

/**
 * @api {get} /api/tickets/:id/related_users Get related users for a ticket
 * @apiName GetRelatedUsers
 * @apiGroup related_users
 *
 * @apiSuccess {Object[]} . List of related users
 */
app.get("/api/tickets/:id/related_users", function(req, res, next) {
    RelatedUser.collection()
    .query('where', 'ticket_id', '=', req.params.id)
    .fetch()
    .then(function(collection) {
        res.json(collection.toJSON());
    })
    .catch(next);
});

module.exports = app;

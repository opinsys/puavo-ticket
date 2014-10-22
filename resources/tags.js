
"use strict";

var express = require("express");
var debug = require("debug")("app:resources/tags");

var Ticket = require("../models/server/Ticket");
var Tag = require("../models/server/Tag");
var Acl = require("../models/Acl");

var app = express.Router();


/**
 * @api {post} /api/tickets/:id/tags Add tag to a ticket
 * @apiName AddTag
 * @apiGroup tags
 *
 * @apiParam {String} tag
 */
app.post("/api/tickets/:id/tags", function(req, res, next) {
    debug(
        "Trying to add tag %s to %s",
        req.body.tag, req.params.id
     );

     var tag = new Tag({ tag: req.body.tag });

    Ticket.fetchByIdConstrained(req.user, req.params.id, {
        withRelated: "handlerUsers"
    })
    .then(function(ticket) {
        if (!ticket) throw Ticket.NotFoundError();
        if (!req.user.acl.canEditTag(ticket, tag)) {
            throw new Acl.PermissionDeniedError();
        }

        return ticket.addTag(tag, req.user)
        .then(function(tag) {
            debug("tag %s ok", req.body.tag);
            res.json(tag.toJSON());
        });
    })
    .catch(next);
});

app.delete("/api/tickets/:id/tags/:tagName", function(req, res, next) {
    var tag = new Tag({ tag: req.params.tagName });

    Ticket.fetchByIdConstrained(req.user, req.params.id, {
        withRelated: "handlerUsers"
    })
    .then(function(ticket) {
        if (!req.user.acl.canEditTag(ticket, tag)) {
            throw new Acl.PermissionDeniedError();
        }
        return ticket.tags().query(function(q) {
            q.where({ tag: req.params.tagName, deleted: 0 });
        })
        .fetch();
    })
    .then(function(coll) {
        if (coll.size() === 0) throw new Ticket.NotFoundError();
        return coll.models;
    })
    .map(function(tag) {
        return tag.softDelete(req.user);
    })
    .then(function(deletedTags) {
        res.json(deletedTags);
    })
    .catch(next);
});

module.exports = app;

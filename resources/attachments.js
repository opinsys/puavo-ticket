"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var express = require("express");

var Ticket = require("../models/server/Ticket");
var Attachment = require("../models/server/Attachment");
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));

var app = express.Router();


/**
 * @api {post} /api/tickets/:id/attachments Add attachment to a ticket
 * @apiName CreateAttachment
 * @apiGroup attachments
 *
 * @apiParam {Binary} attachment
 */
app.post("/api/tickets/:id/attachments", function(req, res, next) {
    var filePromise = fs.readFileAsync(req.files.attachment[0].path);
    var ticketPromise = Ticket.fetchByIdConstrained(req.user, req.params.id);
    Promise.all([filePromise, ticketPromise])
    .spread(function(data, ticket){
        if (!ticket) return res.json(404, { error: "no such ticket" });
        return Attachment.forge({
            dataType: req.files.attachment[0].headers["content-type"],
            data: data,
            filename: req.files.attachment[0].originalFilename,
            createdById: req.user.id,
            ticketId: ticket.id
        })
        .save();
    })
    .then(function(attachment) {
        res.json({ok: true});
    })
    .catch(next);
});

module.exports = app;

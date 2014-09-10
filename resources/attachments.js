"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var express = require("express");
var Promise = require("bluebird");
var concat = require("concat-stream");
var debug = require("debug")("puavo-ticket:resources/attachments");
var Promise = require("bluebird");
var multiparty = require("multiparty");

var Ticket = require("../models/server/Ticket");
var Comment = require("../models/server/Comment");
var Attachment = require("../models/server/Attachment");

var app = express.Router();

debug("Attachments debug active");

app.post("/api/tickets/:ticketId/comments/:commentId/attachments", function(req, res, next) {

    Ticket.fetchByIdConstrained(req.user, req.params.ticketId)
    .then(function(ticket) {
        return Comment.forge({
            id: req.params.commentId,
            ticketId: ticket.get("id"),
            createdById: req.user.get("id") // must be created by the current user
        })
        .fetch({ require: true });
    })
    .then(function(comment) {
        return new Promise(function(resolve, reject){
            var form = new multiparty.Form();
            form.on("error", reject);
            var fileOps = [];

            form.on("part", function(part) {
                part.on("error", reject);

                 // filename is "null" when this is a field and not a file
                if (part.filename === null) {
                    // Ignore it
                    part.resume();
                    return;
                }

                debug("Got file %s", part.filename);
                part.pipe(concat(function(data) {
                    fileOps.push(comment.addAttachment(
                        data,
                        part.filename,
                        part.headers["content-type"],
                        req.user
                    ));
                }));

            });

            form.on("close", function() {
                debug("All files received");
                resolve(Promise.all(fileOps));
            });

            form.parse(req);
        });
    })
    .then(function(attachments) {
        debug("files ok");
        res.json(attachments.map(function(a) {
            // do not send the data back
            return a.omit("data");
        }));
    })
    .catch(next);

});

app.get("/api/tickets/:ticketId/comments/:commentId/attachments/:attachmentId", function(req, res, next) {
    Ticket.fetchByIdConstrained(req.user, req.params.ticketId)
    .then(function(ticket) {
        return Attachment.byId(req.params.attachmentId)
            .fetch({ require: true });
    })
    .then(function(attachment) {
        var data = attachment.get("data");
        res.set({
            "Content-Type": attachment.get("dataType"),
            "Content-Length": data.length
        });

        res.write(data);
        res.end();
    })
    .catch(next);
});

module.exports = app;

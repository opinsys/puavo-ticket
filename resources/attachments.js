"use strict";
/**
 * REST resources documented with http://apidocjs.com/
 */

var express = require("express");
var Promise = require("bluebird");
var debug = require("debug")("app:resources/attachments");
var Promise = require("bluebird");
var multiparty = require("multiparty");
var filesize = require("filesize");
var prettyMs = require("pretty-ms");

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
                debug("Got file %s", part.filename);
                part.on("error", reject);

                 // filename is "null" when this is a field and not a file
                if (part.filename === null) {
                    // Ignore it
                    part.resume();
                    return;
                }

                fileOps.push(comment.addAttachment(
                    part.filename,
                    part.headers["content-type"],
                    part,
                    req.user
                ));

            });

            form.on("close", function() {
                debug("File form parsed");
                resolve(Promise.all(fileOps));
            });

            form.parse(req);
        });
    })
    .then(function(attachments) {
        debug("Files saved to database");
        res.json(attachments);
    })
    .catch(next);

});

app.get("/api/tickets/:ticketId/comments/:commentId/attachments/:attachmentId/:filename", function(req, res, next) {
    Ticket.fetchByIdConstrained(req.user, req.params.ticketId)
    .then(function(ticket) {
        return Attachment.byId(req.params.attachmentId).fetch({ require: true });
    })
    .then(function(attachment) {
        if (attachment.isStillUploading()) {
            res.status(404).header("Content-Type", "text/plain; charset=utf-8");
            return res.end("Tiedosto ei ole aivan vielä valmis. Odota hetki ja yritä uudestaan.");
        }

        res.writeHead(200, {
            "Content-Type": attachment.getContentType(),
            "Content-Length": attachment.get("size")
        });

        return new Promise(function(resolve, reject){
            var start = Date.now();
            var filename = attachment.get("filename");
            var size = attachment.get("size");
            debug(
                "Reading %s with %s",
                filename, filesize(size)
            );
            var file = attachment.readStream();
            file.on("error", reject);
            file.on("end", function() {
                var duration = Date.now() - start;
                var speed = size / (duration / 1000);
                debug(
                    "%s read in %s (%s/s)",
                    filename, prettyMs(duration), filesize(speed)
                );
            });

            file.pipe(res);
        });

    })
    .catch(next);
});

module.exports = app;

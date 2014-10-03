"use strict";
var express = require("express");
var debug = require("debug")("app:email");
var prettyMs = require("pretty-ms");
var Promise = require("bluebird");
var multiparty = require("multiparty");
var concat = require("concat-stream");
var uuid = require("uuid");

var db = require("app/db");
var config = require("app/config");
var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");
var Email = require("app/models/server/Email");

/**
 * @namespace resources
 * @class emails
 */
var app = express.Router();



/**
 * Archive given data as email
 *
 * @static
 * @private
 * @method createArchivedEmail
 * @param {Object} data
 * @return {Bluebird.Promise} models.server.Email
 */
function createArchivedEmail(data) {
    return Email.forge({
        email: data,
        createdAt: new Date(),
    }).save();
}


/**
 * Return true if the request is a multipart request
 *
 * @static
 * @private
 * @method isMultipartPost
 * @param {Object} req Expressjs request object
 * @return {Boolean}
 */
function isMultipartPost(req) {
    return (
        req.method === "POST" &&
        req.headers["content-type"] &&
        req.headers["content-type"].indexOf("multipart/form-data") !== -1
    );
}


/**
 *
 * Receive POST from Mailgun webhook
 *
 * http://documentation.mailgun.com/user_manual.html#parsed-messages-parameters
 *
 * @static
 * @private
 * @method receiveMailGunPOST
 * @param {Object} req Expressjs request object
 * @return {Bluebird.Promise}
 */
function receiveMailGunPOST(req) {
    // If not multipart assume body-parser parsed
    // application/x-www-form-urlencoded or application/json
    if (!isMultipartPost(req)) {
        return createArchivedEmail({
            fields: req.body,
            files: []
        });
    }

    return new Promise(function(resolve, reject){
        var files = [];
        var fields = {};
        var form = new multiparty.Form();
        form.on("error", reject);

        form.on("part", function(part) {
            part.on("error", reject);
            if (!part.filename) {
                part.pipe(concat(function(data) {
                    fields[part.name] = data.toString();
                }));
                return;
            }

            if (part.filename !== null) {
                files.push(db.gridSQL.write(
                    "email-attachment:" + uuid.v4(),
                    part
                ));
            }
        });

        form.on("close", function() {
            Promise.all(files).then(function(files) {
                resolve({
                    fields: fields,
                    files: files.map(function(file) {
                        return {
                            dataType: file.stream.headers["content-type"],
                            fileId: file.fileId,
                            filename: file.stream.filename,
                            size: file.bytesWritten,
                            chunkCount: file.chunkCount
                        };
                    })
                });
            });
        });

        form.parse(req);
    }).then(createArchivedEmail);
}


app.post("/api/emails/new", function(req, res, next) {
    receiveMailGunPOST(req).then(function(email) {
        return email.submitAsNewTicket();
    })
    .then(function(ticket) {
        var comment = ticket.relations.comments.first();
        var user = comment.relations.createdBy;
        res.json({
            externalId: user.getExternalId(),
            userId: user.get("id"),
            ticketId: ticket.get("id"),
            commentId: comment.get("id")
        });
    })
    .catch(next);
});


app.post("/api/emails/reply", function(req, res, next) {
    receiveMailGunPOST(req).then(function(email) {
        return Ticket.byId(email.getTicketId()).fetch()
        .then(function(ticket) {
            if (!ticket) {
                return res.status(404).json({
                    error: { message: "ticket not found" }
                });
            }
            var secret = ticket.get("emailSecret");
            if (!secret || secret !== email.getEmailSecret()) {
                return res.status(401).json({
                    error: { message: "permission denied" }
                });
            }

            return email.submitAsReply(ticket)
            .then(function(comment) {
                var user = email.user;
                res.json({
                    externalId: user.getExternalId(),
                    userId: user.get("id"),
                    ticketId: ticket.get("id"),
                    commentId: comment.get("id")
                });
            });
        });
    })
    .catch(next);
});

function sendEmails(req, res, next) {

    if (req.body.secret !== config.emailJobSecret) {
        return res.status(403).json({ error: "permission denied" });
    }
    var started = Date.now();

    User.collection().fetch()
    .then(function(coll) {
        debug("Going to search for emails for %s users", coll.length);
        return coll.models;
    })
    .map(function(user) {
        if (!user.getEmail()) {
             return;
        }

        return Ticket.withUnreadComments(user, { byEmail: true }).fetch({
            withRelated: "titles"
        }).then(function(coll) {
            return coll.models;
        })
        .map(function(ticket) {
            return ticket.sendBufferedEmailNotifications(user);
        });
    })
    .then(function() {
        var duration = Date.now() - started;

        debug("emails processed in %s", prettyMs(duration));
        res.json({
            ok: true,
            duration: duration,
            durationPretty: prettyMs(duration),
        });
    })
    .catch(next);
}

app.post("/api/send_emails", function(req, res, next) {
    console.log("Call to deprecated /api/send_emails");
    sendEmails(req, res, next);
});
app.post("/api/emails/send", sendEmails);

module.exports = app;

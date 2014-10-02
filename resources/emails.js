"use strict";
var express = require("express");
var debug = require("debug")("app:email");
var prettyMs = require("pretty-ms");
var parseOneAddress = require("email-addresses").parseOneAddress;
var Promise = require("bluebird");
var multiparty = require("multiparty");
var fs = Promise.promisifyAll(require("fs"));

var config = require("app/config");
var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");
var parseReplyEmailAddress = require("app/utils/parseReplyEmailAddress");

/**
 * @class emails
 */
var app = express.Router();


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
 * Ensure user for parsed email body
 */
function ensureUser(parsed) {
    var userOb = parseOneAddress(parsed.fields.from);
    var firstName = "";
    var lastName = userOb.name;

    return User.ensureUserByEmail(userOb.address, firstName, lastName)
    .then(function(user) {
        parsed.user = user;
        return parsed;
    });
}


/**
 * Parse multipart and url encoded Expressjs requests. Assumes body-parser
 * middleware.
 *
 * @static
 * @private
 * @method parseBody
 * @param {Object} req Expressjs request object
 * @return {Bluebird.Promise}
 */
function parseBody(req) {
    // If not multipart assume body-parser parsed
    // application/x-www-form-urlencoded or application/json
    if (!isMultipartPost(req)) {
        return Promise.resolve({
            fields: req.body,
            files: []
        });
    }

    return new Promise(function(resolve, reject){
        var files = [];
        var fields = {};
        var form = new multiparty.Form();
        form.parse(req);
        form.on("error", reject);
        form.on("field", function(name, value) {
            // XXX: Overrides fields that have the same name...
            fields[name] = value;
        });
        form.on("file", function(name, file) {
            files.push(file);
        });

        form.on("close", function() {
            resolve({
                fields: fields,
                files: files
            });
        });
    });
}


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


app.post("/api/emails/new", function(req, res, next) {
    var response = {};
    parseBody(req).then(ensureUser).then(function(parsed) {

        var user = parsed.user;
        var title = parsed.fields.subject;
        var description = parsed.fields["stripped-text"];

        response.userId = user.get("id");
        response.externalId = user.get("externalId");

        return Ticket.create(title, description, user)
        .then(function(ticket) {
            response.ticketId = ticket.get("id");
            return ticket.load("comments");
        })
        .then(function(ticket) {
            var comment = ticket.relations.comments.first();
            response.commentId = comment.get("id");

            return Promise.map(parsed.files, function(file) {
                return comment.addAttachment(
                    file.originalFilename,
                    file.headers["content-type"],
                    fs.createReadStream(file.path),
                    user
                ).then(function() {
                    return fs.unlinkAsync(file.path);
                });
            });
        });
    })
    .then(function() {
        res.json(response);
    })
    .catch(next);
});


app.post("/api/emails/reply", function(req, res, next) {
    var response = {};
    parseBody(req).then(ensureUser).then(function(parsed) {
        response.userId = parsed.user.get("id");
        response.externalId = parsed.user.get("externalId");

        var mail = parseReplyEmailAddress(parsed.fields.recipient);
        if (!mail) return res.status(400).json({
            error: { message: "Invalid sender address" }
        });

        return Ticket.byId(mail.ticketId).fetch()
        .then(function(ticket) {
            if (!ticket) {
                return res.status(404).json({
                    error: { message: "ticket not found" }
                });
            }

            var secret = ticket.get("emailSecret");
            if (!secret || secret !== mail.emailSecret) {
                return res.status(401).json({
                    error: { message: "permission denied" }
                });
            }

            response.ticketId = ticket.get("id");
            return ticket.addComment(parsed.fields["stripped-text"], parsed.user)
            .then(function(comment) {
                response.commentId = comment.get("id");
                res.json(response);
            });
        });
    })
    .catch(next);
});

module.exports = app;

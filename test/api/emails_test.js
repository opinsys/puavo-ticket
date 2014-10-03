"use strict";

var Promise = require("bluebird");
var assert = require("assert");
var fs = require("fs");
var request = require("supertest");
var concat = require("concat-stream");
var crypto = require("crypto");

var helpers = require("app/test/helpers");
var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");
var app = require("app/server");

function streamMailFixture(name) {
    return fs.createReadStream(__dirname + "/email_fixtures/" + name + ".txt");
}

function streamFixture2Req(name, req) {

    return new Promise(function(resolve, reject){

        // Workaround a supertest/superagent bug. Superagent assumes that
        // req.end is called with a callback function. But when piping data to
        // it the stream will call the end() without the function because
        // that's the way the node.js streams work. Superagent does not know
        // how to handle this situation and crashes.
        //
        // Workaround it by wrapping the end function and forcing a callback.
        //
        // XXX create bug to upstream
        var origEnd = req.end;
        req.end = function(last) {
            assert(!last, "missing chunk");
            origEnd.call(req, function(err, res) {
                if (err) return reject(err);
                resolve(res);
            });
        };

        streamMailFixture(name)
        .on("error", reject)
        .pipe(req)
        .on("error", reject);
    });
}


describe("Email handler", function() {

    before(function() {
        return helpers.clearTestDatabase()
        .then(function() {
            return User.ensureUserFromJWTToken({
                id: 1234,
                username: "esa",
                first_name: "Esa-Matti",
                last_name: "Suuronen",
                organisation_name: "Testing",
                organisation_domain: "testing.opinsys.fi",
                email: "esa-matti.suuronen@outlook.com"
                // XXX no schools here
            });
        });
    });

    it("can create new ticket from emails", function() {

        var req = request(app).post("/api/emails/new");
        req.set("Content-Type", "application/x-www-form-urlencoded");

        return streamFixture2Req("new_outlook", req)
        .then(function(res) {
            assert.equal(res.status, 200, res.text);
            assert.equal(1, res.body.userId);
            assert.equal(1234, res.body.externalId);
            assert.equal(1, res.body.ticketId);
            assert.equal(1, res.body.commentId);

            return Ticket.byId(res.body.ticketId).fetch({
                require: true,
                withRelated: [
                    "createdBy",
                    "titles",
                    "comments",
                    "comments.createdBy"
                ]
            });
        })
        .then(function(ticket) {
            assert(ticket);
            assert.equal("Test issue from outlook.com", ticket.getCurrentTitle());
            assert.equal(
                "Esa-Matti Suuronen",
                ticket.relations.createdBy.getFullName()
            );
            assert.equal(
                "esa-matti.suuronen@outlook.com",
                ticket.relations.createdBy.getEmail()
            );

            var firstComment = ticket.relations.comments.first();
            assert(firstComment, "has first comment");
            assert.equal(
                "Hello.\r\nThis is in bold.",
                firstComment.get("comment")
            );

            assert.equal(
                "Esa-Matti Suuronen",
                firstComment.relations.createdBy.getFullName()
            );
            assert.equal(
                "esa-matti.suuronen@outlook.com",
                firstComment.relations.createdBy.getEmail()
            );

        });
    });

    it("can create new tickets with attachments", function() {
        var req = request(app).post("/api/emails/new");
        req.set("Content-Type", "multipart/form-data; boundary=385945c4-8dad-45e8-9249-84a0424a83ed");

        return streamFixture2Req("new_outlook_with_attachment", req)
        .then(function(res) {
            assert.equal(res.status, 200, res.text);
            assert.equal(1, res.body.userId);
            assert.equal(1234, res.body.externalId);
            assert.equal(2, res.body.ticketId);
            assert.equal(2, res.body.commentId);

            return Ticket.byId(res.body.ticketId).fetch({
                require: true,
                withRelated: [
                    "createdBy",
                    "titles",
                    "comments",
                    "comments.createdBy",
                    "comments.attachments",
                ]
            });
        })
        .then(function(ticket) {
            assert(ticket);
            assert.equal("Test issue with an attachment", ticket.getCurrentTitle());
            assert.equal(
                "Esa-Matti Suuronen",
                ticket.relations.createdBy.getFullName()
            );
            assert.equal(
                "esa-matti.suuronen@outlook.com",
                ticket.relations.createdBy.getEmail()
            );

            var firstComment = ticket.relations.comments.first();
            assert(firstComment, "has first comment");
            assert.equal(
                "This is from outlook.com.",
                firstComment.get("comment")
            );

            assert.equal(
                "Esa-Matti Suuronen",
                firstComment.relations.createdBy.getFullName()
            );
            assert.equal(
                "esa-matti.suuronen@outlook.com",
                firstComment.relations.createdBy.getEmail()
            );

            assert.equal(1, firstComment.relations.attachments.length);
            var attachment = firstComment.relations.attachments.first();

            return new Promise(function(resolve, reject){
                attachment.readStream()
                .pipe(concat(resolve))
                .on("error", reject);
            });
        })
        .then(function(data) {
            assert.equal(
                "This is an attachment.\n",
                data.toString()
            );
        });

    });

    it("can reply to tickets", function() {
        return Ticket.byId(1).fetch({ require: true })
        .then(function(ticket) {
            return ticket.set({ emailSecret: "checksum" }).save();
        })
        .then(function(ticket) {
            var req = request(app).post("/api/emails/reply");
            req.set("Content-Type", "application/x-www-form-urlencoded");
            return streamFixture2Req("reply_zimbra", req);
        })
        .then(function(res) {
            assert.equal(res.status, 200, res.text);
            assert.equal(1, res.body.ticketId);
            assert.equal(2, res.body.userId);
            assert.equal(3, res.body.commentId);

            return Ticket.byId(res.body.ticketId).fetch({
                require: true,
                withRelated: ["comments", "comments.createdBy"]
            });
        })
        .then(function(ticket) {
            var comment = ticket.relations.comments.last();
            assert.equal("Tämä on vastaus Zimbrasta.", comment.get("comment"));

            var commenter = comment.relations.createdBy;
            assert.equal("Esa-Matti Suuronen", commenter.getFullName());
            assert.equal("esa-matti.suuronen@opinsys.fi", commenter.getEmail());
        });
    });

    it("can reply with an attachment", function() {
        var req = request(app).post("/api/emails/reply");
        req.set("Content-Type", "multipart/form-data; boundary=94229b8e-5746-4a02-9d4b-4cb30029a369");
        return streamFixture2Req("zimbra_reply_with_attachments", req)
        .then(function(res) {
            assert.equal(res.status, 200, res.text);
            assert.equal(1, res.body.ticketId);
            assert.equal(2, res.body.userId);
            assert.equal(4, res.body.commentId);

            return Ticket.byId(res.body.ticketId).fetch({
                require: true,
                withRelated: ["comments", "comments.createdBy", "comments.attachments"]
            });
        })
        .then(function(ticket) {
            var comment = ticket.relations.comments.last();
            assert.equal(
                "> Can you give me the picture\r\n\r\nHere's the picture as an attachment.",
                comment.get("comment")
            );

            var commenter = comment.relations.createdBy;
            assert.equal("Esa-Matti Suuronen", commenter.getFullName());
            assert.equal("esa-matti.suuronen@opinsys.fi", commenter.getEmail());

            assert.equal(1, comment.relations.attachments.length);
            var attachment = comment.relations.attachments.first();
            assert.equal(159, attachment.get("size"));
            assert.equal(1, attachment.get("chunkCount"));

            return new Promise(function(resolve, reject){
                attachment.readStream()
                .pipe(concat(resolve))
                .on("error", reject);
            });
        })
        .then(function(data) {
            var shasum = crypto.createHash("sha1");
            shasum.update(data);
            assert.equal(
                "23da0cc288de7cffd4ec111234159d60ff29ff74",
                shasum.digest("hex")
            );
        });

    });

});

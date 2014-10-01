"use strict";

var Promise = require("bluebird");
var assert = require("assert");
var fs = require("fs");
var request = require("supertest");

var helpers = require("app/test/helpers");
var Ticket = require("app/models/server/Ticket");
var app = require("app/server");

function streamMailFixture(name) {
    return fs.createReadStream(__dirname + "/email_fixtures/" + name + ".txt");
}

function streamFixture2Req(name, req) {

    return new Promise(function(resolve, reject){
        var origEnd = req.end;
        req.end = function(last) {
            assert(!last, "missing chunk");
            origEnd.call(req, function(err, res) {
                if (err) return reject(err);
                resolve(res);
            });
        };

        var s = streamMailFixture(name);
        s.on("error", reject);
        req.on("error", reject);
        s.pipe(req);
    });
}

before(function() {
    return helpers.clearTestDatabase();
});

describe("Email handler", function() {
    it("can create new ticket from emails", function() {

        var req = request(app).post("/api/emails/new");
        req.set("Content-Type", "application/x-www-form-urlencoded");

        return streamFixture2Req("new_outlook", req)
        .then(function(res) {
            assert.equal(res.status, 200, res.text);
            assert.equal(1, res.body.userId);
            assert.equal(1, res.body.ticketId);

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

});

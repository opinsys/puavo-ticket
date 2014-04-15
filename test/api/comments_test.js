"use strict";
var helpers = require("../helpers");

var assert = require("assert");

var Ticket = require("../../models/server/Ticket");
var Comment = require("../../models/server/Comment");


describe("/api/tickets/:id/comments", function() {

    var ticket = null;
    var otherTicket = null;
    var commentForOtherTicket = null;

    before(function() {
        var self = this;

        return helpers.clearTestDatabase()
            .then(function() {
                return helpers.loginAsUser(helpers.user.teacher);
            })
            .then(function(agent) {
                self.agent = agent;
            })
            .then(function() {
                ticket = Ticket.forge({
                    title: "Test ticket",
                    description: "Test ticket with comments"
                });
                return ticket.save();
            })
            .then(function() {
                otherTicket = Ticket.forge({
                    title: "Other test ticket",
                    description: "Other test tickets"
                });
                return otherTicket.save();
            })
            .then(function() {
                commentForOtherTicket = Comment.forge({
                    ticket: otherTicket.id,
                    comment: "Comment for other ticket"
                });
                return commentForOtherTicket.save();
            });
    });

    after(function() {
        return this.agent.logout();
    });


    it("can create new comment to ticket", function(done) {
        this.agent
        .post("/api/tickets/" + ticket.get("id") + "/comments")
        .send({
            comment: "test comment for ticket",
        })
        .expect(200)
        .end(function(err, res) {
            if (err) {
                return done(err);
            }

            assert.equal(res.body.comment, "test comment for ticket");
            assert.equal(res.body.ticket, ticket.get("id"));
            done();
        });

    });

    it("can get the comments by ticket", function(done) {
        this.agent
        .get("/api/tickets/" + ticket.get("id") + "/comments")
        .expect(200)
        .end(function(err, res) {
            if (err) {
                return done(err);
            }

            assert.equal(1, res.body.length);
            assert.equal("test comment for ticket", res.body[0].comment);
            done();
        });

    });


});

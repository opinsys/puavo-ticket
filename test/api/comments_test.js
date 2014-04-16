"use strict";
var helpers = require("../helpers");

var assert = require("assert");

var Comment = require("../../models/server/Comment");


describe("/api/tickets/:id/comments", function() {

    var ticket = null;
    var otherTicket = null;
    var commentForOtherTicket = null;

    before(function() {
        var self = this;

        return helpers.clearTestDatabase()
            .then(function() {
                return helpers.insertTestTickets();
            })
            .then(function(tickets) {
                ticket = tickets.ticket;
                otherTicket = tickets.otherTicket;

                return helpers.loginAsUser(helpers.user.teacher);
            })
            .then(function(agent) {
                self.agent = agent;
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

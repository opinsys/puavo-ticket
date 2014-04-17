"use strict";
var helpers = require("../helpers");

var assert = require("assert");


describe("/api/tickets/:id/comments", function() {

    var ticket = null;
    var otherTicket = null;

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
            });
    });

    after(function() {
        return this.agent.logout();
    });


    it("can create new comment to ticket", function(done) {
        this.agent
        .post("/api/tickets/" + ticket.get("id") + "/comments")
        .send({
            comment: "add more test comment for ticket"
        })
        .end(function(err, res) {
            if (err) {
                return done(err);
            }
            assert.equal(res.status, 200);
            assert.equal(res.body.comment, "add more test comment for ticket");
            assert.equal(res.body.ticket, ticket.get("id"));
            done();
        });

    });

    it("can get the comments by ticket", function(done) {
        this.agent
        .get("/api/tickets/" + ticket.get("id") + "/comments")
        .end(function(err, res) {
            if (err) {
                return done(err);
            }

            assert.equal(res.status, 200);
            assert.equal(3, res.body.length);
            assert.equal("add more test comment for ticket", res.body[2].comment);
            done();
        });

    });


});

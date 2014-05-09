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
                return helpers.loginAsUser(helpers.user.teacher);
            })
            .then(function(agent) {
                self.agent = agent;

                return helpers.fetchTestUser();
            })
            .then(function(user) {
                self.user = user;

                return helpers.insertTestTickets(user);
            })
            .then(function(tickets) {
                ticket = tickets.ticket;
                otherTicket = tickets.otherTicket;
            });

    });

    after(function() {
        return this.agent.logout();
    });


    it("can create new comment to ticket", function() {
        var self = this;
        return this.agent
            .post("/api/tickets/" + ticket.get("id") + "/comments")
            .send({
                comment: "add more test comment for ticket"
            })
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(res.body.comment, "add more test comment for ticket");
                assert.equal(res.body.ticket_id, ticket.get("id"));
                assert.equal(res.body.created_by, self.user.id);
            });
    });

    it("can get the comments by ticket", function() {
        return this.agent
            .get("/api/tickets/" + ticket.get("id") + "/comments")
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(3, res.body.length);
                assert.equal("add more test comment for ticket", res.body[2].comment);
            });
    });


});

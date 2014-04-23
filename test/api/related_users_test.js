"use strict";
var helpers = require("../helpers");

var assert = require("assert");

describe("/api/tickets/:id/related_users", function() {

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


    it("can add related user to ticket", function() {
        return this.agent
            .post("/api/tickets/" + ticket.get("id") + "/related_users")
            .send({
                user_id: 1,
                username: "testuser"
            })
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(res.body.username, "testuser");
                assert.equal(res.body.ticket, ticket.get("id"));
                assert.equal(res.body.user, 1);
            });
    });

    it("can get the related users by ticket", function() {
        return this.agent
            .get("/api/tickets/" + ticket.get("id") + "/related_users")
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(2, res.body.length);
                assert.equal("testuser", res.body[1].username);
            });
    });
});

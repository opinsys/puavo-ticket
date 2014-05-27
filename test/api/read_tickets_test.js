"use strict";
var helpers = require("../helpers");

var assert = require("assert");


describe("/api/tickets/:id/read", function() {

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


    it("can mark ticket as read", function() {
        return this.agent
            .post("/api/tickets/" + ticket.get("id") + "/read")
            .send()
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
            });
    });

});

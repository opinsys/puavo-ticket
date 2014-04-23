"use strict";
var helpers = require("../helpers");

var assert = require("assert");


describe("/api/tickets/:id/devices", function() {

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


    it("can add device to ticket", function() {
        return this.agent
            .post("/api/tickets/" + ticket.get("id") + "/devices")
            .send({
                hostname: "fatclient-01"
            })
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(res.body.hostname, "fatclient-01");
                assert.equal(res.body.ticket, ticket.get("id"));
                assert.equal(res.body.user, 1);
            });
    });
});

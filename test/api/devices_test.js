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


    it("can add device to ticket", function() {
        var self = this;
        return this.agent
            .post("/api/tickets/" + ticket.get("id") + "/devices")
            .send({
                hostname: "fatclient-01"
            })
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(res.body.hostname, "fatclient-01");
                assert.equal(res.body.ticket_id, ticket.get("id"));
                assert.equal(res.body.created_by, self.user.id);
            });
    });

    it("is listed on /api/tickets/:id/updates", function() {
        return this.agent
            .get("/api/tickets/" + ticket.get("id") + "/updates")
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                var deviceEntry = res.body.filter(function(update) {
                    return update.hostname === "fatclient-01";
                });

                assert.equal(
                    deviceEntry.length, 1,
                    "cannot find the device from updates resource"
                );

                assert(
                    deviceEntry[0].createdBy,
                    "device has createdBy property"
                );

                assert.equal("olli.opettaja", deviceEntry[0].createdBy.external_data.username);

            });
    });

});

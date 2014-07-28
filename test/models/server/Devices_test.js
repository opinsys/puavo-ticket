"use strict";

var helpers = require("../../helpers");

var Device = require("../../../models/server/Device");
var assert = require("assert");

describe("Device model", function() {

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
                self.ticket = tickets.ticket;
                self.otherTicket = tickets.otherTicket;
            });
    });

    it("Instance can be created", function() {
        var self = this;

        return Device.forge({
                ticketId: self.ticket.id,
                createdById: self.user.id,
                hostname: "fatclient-01"
            })
            .save()
            .then(function(device) {
                return Device.forge({ id: device.get("id") }).fetch();
            })
            .then(function(device) {
                assert.equal("fatclient-01", device.get("hostname"));
            });


    });
});

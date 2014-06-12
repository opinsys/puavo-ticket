"use strict";

var helpers = require("../../helpers");

var ReadTicket = require("../../../models/server/ReadTicket");
var assert = require("assert");

describe("ReadTicket model", function() {

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

        return ReadTicket.forge({
                ticket_id: self.ticket.id,
                readById: self.user.id,
                readAt: new Date('2013', '01', '01'),
                unread: true
            })
            .save()
            .then(function(readTicket) {
                return ReadTicket.forge({ id: readTicket.get("id") }).fetch();
            })
            .then(function(readTicket) {
                assert.equal(new Date('2013', '01', '01').toString(), readTicket.get("readAt").toString());
            });


    });
});

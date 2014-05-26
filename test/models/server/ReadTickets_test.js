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
                read_by: self.user.id,
                read_at: new Date('2013', '01', '01'),
                updates: true
            })
            .save()
            .then(function(read_ticket) {
                return ReadTicket.forge({ id: read_ticket.get("id") }).fetch();
            })
            .then(function(read_ticket) {
                assert.equal(new Date('2013', '01', '01').toString(), read_ticket.get("read_at").toString());
            });


    });
});

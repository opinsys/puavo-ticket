"use strict";

var helpers = require("../../helpers");

var assert = require("assert");

describe("RelatedUser model", function() {

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
        return self.ticket.addRelatedUser(self.user, self.user)
            .then(function(user) {
                return self.ticket.relatedUsers().fetch();
            })
            .then(function(relatedUsers) {
                assert.equal(self.user.get("id"), relatedUsers.toJSON()[0].user);
            });


    });
});

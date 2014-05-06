"use strict";

var helpers = require("../../helpers");

var RelatedUser = require("../../../models/server/RelatedUser");
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
        return RelatedUser.forge({
                user_id: self.user.get("id"),
                ticket_id: self.ticket.id,
                external_id: 1,
                username: "testuser"
            })
            .save()
            .then(function(user) {
                return RelatedUser.forge({ id: user.get("id") }).fetch();
            })
            .then(function(user) {
                assert.equal("testuser", user.get("username"));
            });


    });
});

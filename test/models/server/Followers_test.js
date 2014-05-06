"use strict";

var helpers = require("../../helpers");

var Follower = require("../../../models/server/Follower");
var assert = require("assert");

describe("Follower model", function() {

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

        return Follower.forge({
                ticket: self.ticket.id,
                user_id: self.user.id
            })
            .save()
            .then(function(follower) {
                return Follower.forge({ id: follower.get("id") }).fetch();
            })
            .then(function(follower) {
                assert.equal(self.user.id, follower.get("user_id"));
                assert.equal(self.ticket.id, follower.get("ticket"));
            });


    });
});

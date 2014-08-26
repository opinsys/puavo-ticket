"use strict";

var helpers = require("../../helpers");

var Notification = require("../../../models/server/Notification");
var assert = require("assert");

describe("Notification model", function() {

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

        return Notification.forge({
                ticketId: self.ticket.id,
                unreadById: self.user.id,
                readAt: new Date('2013', '01', '01'),
                unread: true
            })
            .save()
            .then(function(notification) {
                return Notification.forge({ id: notification.get("id") }).fetch();
            })
            .then(function(notification) {
                assert.equal(new Date('2013', '01', '01').toString(), notification.get("readAt").toString());
            });


    });
});

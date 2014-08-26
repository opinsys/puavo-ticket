"use strict";
var _ = require("lodash");
var assert = require("assert");

var helpers = require("../helpers");
var Notification = require("../../models/server/Notification");



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
        var self = this;

        return this.agent
            .post("/api/tickets/" + ticket.get("id") + "/read")
            .send()
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
            })
            .then(function() {
                return Notification.forge({ targetId: self.user.id }).fetch();
            })
            .then(function(readTicket) {
                assert.equal(readTicket.get("ticketId"), ticket.get("id"));
            });
    });

    it("can see is ticket as read", function() {
        var self = this;

        return this.agent
            .get("/api/tickets")
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert(_.find(res.body[0].titles, { title: "Test ticket title" }));
                assert.equal(ticket.get("id"), res.body[0].notifications[0].ticketId);
                assert.equal(self.user.id, res.body[0].notifications[0].targetId);
            });
    });

});

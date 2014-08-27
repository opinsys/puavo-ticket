"use strict";
var _ = require("lodash");
var assert = require("assert");
var Promise = require("bluebird");

var helpers = require("../helpers");
var Notification = require("../../models/server/Notification");
var User = require("../../models/server/User");
var Ticket = require("../../models/server/Ticket");



describe("/api/tickets/:id/read", function() {

    before(function() {
        var self = this;
        return helpers.clearTestDatabase()
            .then(function() {
                return Promise.join(
                    User.ensureUserFromJWTToken(helpers.user.manager),
                    User.ensureUserFromJWTToken(helpers.user.teacher),
                    User.ensureUserFromJWTToken(helpers.user.teacher2)
                );
            })
            .spread(function(manager, user, otherUser) {
                self.manager = manager;
                self.user = user;
                self.otherUser = otherUser;

                return Promise.join(
                    Ticket.create(
                        "The Ticket",
                        "Will get notifications",
                        self.user
                    ),
                    Ticket.create(
                        "An other ticket",
                        "This is other ticket without any notifications for the user",
                        self.otherUser
                    ),
                    helpers.loginAsUser(helpers.user.teacher)
                );
            })
            .spread(function(ticket, otherTicket, agent) {
                self.ticket = ticket;
                self.otherTicket = otherTicket;
                self.agent = agent;
            });
    });

    after(function() {
        return this.agent.logout();
    });


    it("can mark ticket as read", function() {
        var self = this;
        return this.agent
            .post("/api/tickets/" + self.ticket.get("id") + "/read")
            .send()
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200, res.text);
                // The Notification object is returned
                assert.equal("notifications", res.body.type);
            })
            .then(function() {
                return Notification.forge({ ticketId: self.ticket.get("id") }).fetch();
            })
            .then(function(notification) {
                assert.equal(notification.get("ticketId"), self.ticket.get("id"));
            });
    });

    it("can see is ticket as read", function() {
        var self = this;
        return this.agent
            .get("/api/tickets")
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert(_.find(res.body[0].titles, { title: "The Ticket" }));
                assert.equal(self.ticket.get("id"), res.body[0].notifications[0].ticketId);
                assert.equal(self.user.get("id"), res.body[0].notifications[0].targetId);
            });
    });

});

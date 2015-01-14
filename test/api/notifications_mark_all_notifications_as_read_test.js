"use strict";
var assert = require("assert");
var Promise = require("bluebird");

var helpers = require("app/test/helpers");
var User = require("app/models/server/User");
var Ticket = require("app/models/server/Ticket");



describe("mark all notifications as read", function() {
    before(function() {
        var self = this;
        return helpers.clearTestDatabase()
            .then(function() {
                return Promise.join(
                    User.ensureUserFromJWTToken(helpers.user.manager),
                    User.ensureUserFromJWTToken(helpers.user.teacher)
                );
            })
            .spread(function(manager, user, otherUser) {
                self.manager = manager;
                self.user = user;
                return Promise.all([
                    Ticket.create(
                        "The Ticket",
                        "foo get notifications (first comment)",
                        self.user
                    ),
                    Ticket.create(
                        "An other ticket",
                        "bar",
                        self.user
                    ),
                    Ticket.create(
                        "Yet another ticket",
                        "baz is an yet another ticket",
                        self.user
                    ),
                ]);
            })
            .each(function(ticket) {
                return ticket.addHandler(self.manager, self.manager);
            })
            .each(function(ticket) {
                return ticket.addComment("A comment", self.user);
            })
            .then(function() {
                return helpers.loginAsUser(helpers.user.manager);
            })
            .then(function(agent) {
                self.agent = agent;
            });
    });

    it("has unread notifications", function() {
        var self = this;
        return self.agent
        .get("/api/notifications")
        .promise()
        .then(function(res) {
            assert.equal(200, res.status, res.text);
            assert.equal(3, res.body.length);
        });
    });

    it("can mark notifications as read", function() {
        var self = this;
        return this.agent
        .post("/api/mark_all_notifications_as_read")
        .set("x-csrf-token", self.agent.csrfToken)
        .send().promise()
        .then(function(res) {
            assert.equal(200, res.status, res.text);
            assert.equal(3, res.body.count);
        });

    });

    it("the notifications list is empty", function() {
        var self = this;
        return self.agent
        .get("/api/notifications")
        .promise()
        .then(function(res) {
            assert.equal(200, res.status, res.text);
            assert.equal(0, res.body.length);
        });
    });

    // TODO: assert that no other notifications are set as read

});

"use strict";

var assert = require("assert");
var Promise = require("bluebird");

var helpers = require("../../helpers");
var Notification = require("../../../models/server/Notification");
var Ticket = require("../../../models/server/Ticket");
var User = require("../../../models/server/User");

describe("Ticket notifications", function() {

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
                        "Other ticket",
                        "This is other ticket without any notifications for the user",
                        self.otherUser
                    )
                );
            })
            .spread(function(ticket, otherTicket) {
                self.ticket = ticket;
                self.otherTicket = otherTicket;
            });
    });

    it("are empty for new own tickets", function() {
        var self = this;
        return Notification.fetchFollowerNotifications(self.user)
            .then(function(coll) {
                assert.equal(
                    0, coll.size(),
                    "Should not have any notification. Got " + coll.size()
                );
            });
    });

    it("are given to followers only", function() {
        var self = this;
        // Mark otherTicket as read
        return self.otherTicket.markAsRead(self.user)
            .then(function() {
                // Comment in the other ticket does not trigger notification
                // because the user is not following it
                return self.otherTicket.addComment(
                    "comment to other ticket by other user",
                    self.otherUser
                );
            })
            .then(function() {
                // But comment in the followed ticket (own ticket) triggers a notification
                return self.ticket.addComment(
                    "Comment which triggers update for the user",
                    self.otherUser
                );
            })
            .then(function() {
                return Notification.fetchFollowerNotifications(self.user);
            })
            .then(function(coll) {
                assert.equal(1, coll.size());
                assert(
                    coll.findWhere({ ticketId: self.ticket.get("id") }),
                    "didn't get the notification about the followed ticket"
                );
            });
    });

    it("are empty after setting ticket as read", function() {
        var self = this;
        return self.ticket.markAsRead(self.user)
            .delay(100)
            .then(function() {
                return Notification.fetchFollowerNotifications(self.user);
            })
            .then(function(coll) {
                assert.equal(0, coll.size(), "no notifications after marking as read");
            });
    });

    it("are not sent even if the user was once a follower", function() {
        var self = this;
        return self.otherTicket.addFollower(self.user, self.user)
            .then(function() {
                return self.otherTicket.removeFollower(self.user, self.user);
            })
            .then(function() {
                return self.otherTicket.addComment("foo", self.otherUser);
            })
            .delay(100)
            .then(function() {
                return Notification.fetchFollowerNotifications(self.user);
            })
            .then(function(coll) {
                assert.equal(0, coll.size());
            });
    });

});

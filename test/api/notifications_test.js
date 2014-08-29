"use strict";
var _ = require("lodash");
var assert = require("assert");
var Promise = require("bluebird");

var helpers = require("app/test/helpers");
var Notification = require("app/models/server/Notification");
var User = require("app/models/server/User");
var Ticket = require("app/models/server/Ticket");



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
                        "Will get notifications (first comment)",
                        self.user
                    ),
                    Ticket.create(
                        "An other ticket",
                        "This is other ticket without any notifications for the user",
                        self.otherUser
                    ),
                    Ticket.create(
                        "Yet another ticket",
                        "This is an yet another ticket",
                        self.otherUser
                    ),
                    helpers.loginAsUser(helpers.user.teacher)
                );
            })
            .spread(function(ticket, otherTicket, yetAnother, agent) {
                self.ticket = ticket;
                self.otherTicket = otherTicket;
                self.agent = agent;

                return yetAnother.addComment("yet another ticket has a random comment", self.otherUser);
            });
    });

    after(function() {
        return this.agent.logout();
    });


    it("marks ticket as read", function() {
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

    it("makes the ticket as read in /api/tickets", function() {
        var self = this;
        return this.agent
            .get("/api/tickets")
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200, res.text);
                assert(_.find(res.body[0].titles, { title: "The Ticket" }));
                assert.equal(self.ticket.get("id"), res.body[0].notifications[0].ticketId);
                assert.equal(self.user.get("id"), res.body[0].notifications[0].targetId);
            });
    });

    describe("/api/notifications", function() {
        it("does not list the ticket if it does not have unread comments", function() {
            return this.agent
                .get("/api/notifications")
                .promise()
                .then(function(res) {
                    assert.equal(res.status, 200, res.text);
                    assert.deepEqual([], res.body);
                });
        });

        it("lists the ticket when a comment is added to it by other user", function() {
            var self = this;
            return self.ticket.addComment("Comment by other user", self.otherUser)
                .then(function() {
                    return self.agent.get("/api/notifications").promise();
                })
                .then(function(res) {
                    assert.equal(res.status, 200, res.text);
                    assert.equal(1, res.body.length);
                    var data = res.body[0];

                    assert(data.titles, "has titles relation");
                    assert(data.titles[0], "has at least one title");
                    assert.equal("The Ticket", data.titles[0].title);

                    assert(data.comments, "has comments relation");
                    assert.equal(1, data.comments.length, "has only one comment");
                    // the comment is the last comment added by the user
                    assert.equal("Comment by other user", data.comments[0].comment);
                    assert(data.comments[0].createdBy, "has comment creator object");
                    // the comment was created by the other user
                    assert.equal(
                        self.otherUser.getUsername(),
                        data.comments[0].createdBy.externalData.username
                    );
                });
        });

        it("list only the latest title for the ticket", function() {
            var self = this;
            return self.ticket.addHandler(self.manager, self.manager)
                .then(function() {
                    return self.ticket.addTitle("A new title", self.manager);
                })
                .then(function() {
                    return self.agent.get("/api/notifications").promise();
                })
                .then(function(res) {
                    assert.equal(res.status, 200, res.text);
                    var data = res.body[0];
                    assert.equal(1, data.titles.length);
                    assert.equal("A new title", data.titles[0].title);
                });
        });

        it("can list multiple tickets", function() {
            var self = this;
            return self.otherTicket.addFollower(self.user, self.user)
                .then(function() {
                    return self.otherTicket.markAsRead(self.user);
                })
                .then(function() {
                    return self.otherTicket.addComment("Comment for the other ticket", self.otherUser);
                })
                .then(function() {
                    return self.agent.get("/api/notifications").promise();
                })
                .then(function(res) {
                    assert.equal(res.status, 200, res.text);
                    assert.equal(2, res.body.length);

                    assert.equal(1, res.body[0].titles.length, "first ticket has one title loaded");
                    assert.equal(1, res.body[1].titles.length, "second ticket has one title loaded");

                    assert.equal(1, res.body[0].comments.length, "first ticket has one comment loaded");
                    assert.equal(1, res.body[1].comments.length, "second ticket has one comment loaded");

                });
        });

    });


});

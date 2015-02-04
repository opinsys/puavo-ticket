"use strict";
var _ = require("lodash");
var assert = require("assert");
var Promise = require("bluebird");

var helpers = require("app/test/helpers");
var Notification = require("app/models/server/Notification");
var User = require("app/models/server/User");
var Ticket = require("app/models/server/Ticket");



describe("/api/tickets/:id/read", function() {

    var ticket, otherTicket, yetAnotherTicket, agent, manager, user, otherUser;

    before(function() {
        return helpers.clearTestDatabase()
        .then(() => Promise.join(
            User.ensureUserFromJWTToken(helpers.user.manager)
            .then((u) => manager = u),

            User.ensureUserFromJWTToken(helpers.user.teacher)
            .then((u) => user = u),

            User.ensureUserFromJWTToken(helpers.user.teacher2)
            .then((u) => otherUser = u)
        ))

        .then(() => Ticket.create(
            "The Ticket",
            "Will get notifications (first comment)",
            user
        ))
        .then((t) => ticket = t)

        .then(() => Ticket.create(
            "An other ticket",
            "This is other ticket without any notifications for the user",
            otherUser
        ))
        .then((t) => otherTicket = t)

        .then(() => Ticket.create(
            "Yet another ticket",
            "This is an yet another ticket",
            otherUser
        ))
        .then((t) => yetAnotherTicket = t)


        .then(() => helpers.loginAsUser(helpers.user.teacher))
        .then((a) => agent = a)

        .then(() => yetAnotherTicket.addComment("yet another ticket has a random comment", otherUser))
        ;

    });

    after(() => agent.logout());


    it("marks ticket as read", function() {
        return agent
            .post("/api/tickets/" + ticket.get("id") + "/read")
            .set("x-csrf-token", agent.csrfToken)
            .send()
            .promise()
            .then(function(res) {
                assert.equal(200, res.status, res.text);
                // The Notification object is returned
                assert.equal("notifications", res.body.type);
            })
            .then(function() {
                return Notification.forge({ ticketId: ticket.get("id") }).fetch();
            })
            .then(function(notification) {
                assert.equal(notification.get("ticketId"), ticket.get("id"));
            });
    });

    it("makes the ticket as read in /api/tickets", function() {
        return agent
            .get("/api/tickets")
            .promise()
            .then(function(res) {
                assert.equal(200, res.status, res.text);
                assert(_.find(res.body[0].titles, { title: "The Ticket" }));
                assert.equal(ticket.get("id"), res.body[0].notifications[0].ticketId);
                assert.equal(user.get("id"), res.body[0].notifications[0].targetId);
            });
    });

    describe("/api/notifications", function() {
        it("does not list the ticket if it does not have unread comments", function() {
            return agent
                .get("/api/notifications")
                .promise()
                .then(function(res) {
                    assert.equal(200, res.status, res.text);
                    assert.deepEqual([], res.body);
                });
        });

        it("lists the ticket when a comment is added to it by other user", function() {
            return ticket.addComment("Comment by other user", otherUser)
                .then(function() {
                    return agent.get("/api/notifications").promise();
                })
                .then(function(res) {
                    assert.equal(200, res.status, res.text);
                    assert.equal(1, res.body.length);
                    var data = res.body[0];

                    assert.equal("Uusi kommentti tukipyyntöön: The Ticket", data.title);

                    assert.equal("Comment by other user", data.body);

                    assert(data.createdBy, "has creator object");
                    // the comment was created by the other user
                    assert.equal(
                        otherUser.getUsername(),
                        data.createdBy.externalData.username
                    );
                });
        });


        it("can list multiple tickets", function() {
            return otherTicket.addFollower(user, user)
                .then(function() {
                    return otherTicket.markAsRead(user);
                })
                .then(function() {
                    return otherTicket.addComment("Comment for the other ticket", otherUser);
                })
                .then(function() {
                    return agent.get("/api/notifications").promise();
                })
                .then(function(res) {
                    assert.equal(200, res.status, res.text);
                    assert.equal(2, res.body.length);

                    assert.equal(
                        "Uusi kommentti tukipyyntöön: The Ticket",
                        res.body[0].title
                    );
                    assert.equal(
                        "Uusi kommentti tukipyyntöön: An other ticket",
                        res.body[1].title
                    );



                });
        });

    });


});

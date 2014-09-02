"use strict";

var assert = require("assert");
var Promise = require("bluebird");
var _ = require("lodash");

var helpers = require("app/test/helpers");
var User = require("app/models/server/User");
var Ticket = require("app/models/server/Ticket");

describe("/api/tickets/:id/comments", function() {

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


    it("can create new comment for the ticket", function() {
        var self = this;
        return this.agent
            .post("/api/tickets/" + self.ticket.get("id") + "/comments")
            .send({
                comment: "another test comment"
            })
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(res.body.comment, "another test comment");
                assert.equal(res.body.ticketId, self.ticket.get("id"));
                assert.equal(res.body.createdById, self.user.id);
            });
    });

    it("are visible in the tickets api", function() {
        var self = this;
        return this.agent
            .get("/api/tickets/" + self.ticket.get("id"))
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert(res.body.comments);
                var comment = _.findWhere(res.body.comments, { comment: "another test comment" });
                assert(comment);
                assert(comment.createdBy);
                assert.equal("olli.opettaja", comment.createdBy.externalData.username);
            });
    });


});

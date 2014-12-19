"use strict";

var Promise = require("bluebird");
var assert = require("assert");

var helpers = require("app/test/helpers");
var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");

describe("/api/tickets adds single comment for each ticket", function() {

    before(function() {
        var self = this;

        return helpers.clearTestDatabase()
            .then(function() {
                return Promise.join(
                    User.ensureUserFromJWTToken(helpers.user.manager),
                    User.ensureUserFromJWTToken(helpers.user.teacher)
                );
            })
            .spread(function(manager, teacher, otherTeacher) {
                self.manager = manager;
                self.teacher = teacher;

                return Ticket.create(
                    "Ticket with two comments",
                    "first comment",
                    self.teacher
                );
            })
            .then(function(ticket) {
                self.ticket = ticket;
                return ticket.addComment("Second comment", self.teacher);
            })
            .then(function() {
                return helpers.loginAsUser(helpers.user.teacher);
            })
            .then(function(agent) {
                self.agent = agent;
            });
    });

    it("the comment is the latest comment", function() {
        return this.agent
        .get("/api/tickets")
        .promise()
        .then(function(res) {
            assert.equal(res.status, 200);
            assert.equal(1, res.body.length);
            var ticketData = res.body[0];
            assert.equal(1, ticketData.comments.length);

            var commentData = ticketData.comments[0];
            assert.equal(
                "Second comment",
                 commentData.comment
            );

        });
    });

    it("hidden comments are not added", function() {
        var self = this;
        return this.ticket.addComment("hidden comment", this.manager, {
            hidden: true
        })
        .then(function() {
            return self.agent
            .get("/api/tickets")
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(1, res.body.length);
                var ticketData = res.body[0];
                assert.equal(1, ticketData.comments.length);

                var commentData = ticketData.comments[0];
                assert.equal(
                    "Second comment",
                     commentData.comment
                );
            });
        });

    });

});

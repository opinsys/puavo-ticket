"use strict";

var assert = require("assert");
var Promise = require("bluebird");
var _ = require("lodash");
var sinon = require("sinon");

var helpers = require("app/test/helpers");
var User = require("app/models/server/User");
var Ticket = require("app/models/server/Ticket");
var server = require("app/server");

describe("/api/tickets/:id/comments", function() {

    before(function() {
        var self = this;

        self.emitSpy = sinon.spy();
        self.toStub = sinon.stub(server.sio.sockets, "to", function() {
            return { emit: self.emitSpy };
        });

        return helpers.clearTestDatabase()
            .then(function() {
                return Promise.join(
                    User.ensureUserFromJWTToken(helpers.user.manager),
                    User.ensureUserFromJWTToken(helpers.user.teacher),
                    User.ensureUserFromJWTToken(helpers.user.teacher2)
                );
            })
            .spread(function(manager, teacher, otherTeacher) {
                self.manager = manager;
                self.teacher = teacher;
                self.otherTeacher = otherTeacher;

                return Promise.join(
                    Ticket.create(
                        "The Ticket",
                        "Will get notifications (first comment)",
                        self.teacher
                    ),
                    helpers.loginAsUser(helpers.user.teacher)
                );
            })
            .spread(function(ticket, agent) {
                self.ticket = ticket;
                self.agent = agent;
            });

    });

    beforeEach(function() {
        this.toStub.reset();
        this.emitSpy.reset();
    });

    after(function() {
        this.toStub.restore();
        return this.agent.logout();
    });


    it("can create a new comment for the ticket", function() {
        var self = this;
        return this.agent
            .post("/api/tickets/" + self.ticket.get("id") + "/comments")
            .set("x-csrf-token", self.agent.csrfToken)
            .send({
                comment: "another test comment"
            })
            .promise()
            .then(function(res) {
                assert.equal(200, res.status, res.text);
                assert.equal(res.body.comment, "another test comment");
                assert.equal(res.body.ticketId, self.ticket.get("id"));
                assert.equal(res.body.createdById, self.teacher.id);
            });
    });

    it("the comments are visible in the tickets api", function() {
        var self = this;
        return this.agent
            .get("/api/tickets/" + self.ticket.get("id"))
            .promise()
            .then(function(res) {
                assert.equal(200, res.status, res.text);
                assert(res.body.comments);
                var comment = _.findWhere(res.body.comments, { comment: "another test comment" });
                assert(comment);
                assert(comment.createdBy);
                assert.equal("olli.opettaja", comment.createdBy.externalData.username);
            });
    });

    it("socket.io messages are sent to the followers about new comments", function() {
        var self = this;

        return self.ticket.addFollower(self.otherTeacher, self.otherTeacher)
        .then(function() {
            return self.agent
                .post("/api/tickets/" + self.ticket.get("id") + "/comments")
                .set("x-csrf-token", self.agent.csrfToken)
                .send({
                    comment: "socket.io message is sent about this comment"
                })
                .promise()
                // The socket.io message sending is sent outside of the request
                // promise chain. Wait for it to complete.
                .delay(100)
                .then(function(res) {
                    assert.equal(200, res.status, res.text);

                    assert(
                        _.find(self.toStub.args, [ self.ticket.getSocketIORoom() ]),
                        "message is emitted to ticket specific room"
                    );

                    // Message about the comment is sent to room of otherTeacher
                    assert.equal(
                        self.otherTeacher.getSocketIORoom(),
                        self.toStub.lastCall.args[0]
                    );

                    // A comment message is emitted to socket.io as a followerUpdate
                    assert.equal("followerUpdate", self.emitSpy.lastCall.args[0]);

                    assert(
                        self.emitSpy.lastCall.args[1],
                        "An actual comment object is passed in"
                    );

                    assert.equal(
                        "socket.io message is sent about this comment",
                        self.emitSpy.lastCall.args[1].comment
                    );

                });
        });
    });


});

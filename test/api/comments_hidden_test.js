"use strict";

var assert = require("assert");
var Promise = require("bluebird");
var _ = require("lodash");
var sinon = require("sinon");
var request = require("supertest");

var helpers = require("app/test/helpers");
var config = require("app/config");
var app = require("app/server");
var User = require("app/models/server/User");
var Ticket = require("app/models/server/Ticket");
var server = require("app/server");

describe("Hidden comments", function() {

    before(function() {
        var self = this;
        self.clock = sinon.useFakeTimers(new Date(2014,9,1,12).getTime(), "Date");
        self.emitSpy = sinon.spy();
        self.toStub = sinon.stub(server.sio.sockets, "to", function() {
            return { emit: self.emitSpy };
        });
        return helpers.clearTestDatabase()
            .then(function() {
                return Promise.join(
                    User.ensureUserFromJWTToken(helpers.user.manager),
                    User.ensureUserFromJWTToken(helpers.user.teacher)
                );
            })
            .spread(function(manager, teacher) {
                self.manager = manager;
                self.teacher = teacher;

                return Ticket.create(
                    "Ticket with hidden comments",
                    "foo",
                    teacher
                );
            })
            .then(function(ticket) {
                self.clock.tick(1000);
                self.ticket = ticket;
                self.sendMailSpy = sinon.spy(config.mailTransport, "sendMail");
            });
    });


    beforeEach(function() {
        this.toStub.reset();
        this.emitSpy.reset();
    });

    after(function() {
        this.sendMailSpy.restore();
        this.clock.restore();
        this.toStub.restore();
    });

    it("can be added by managers", function() {
        var self = this;
        return helpers.loginAsUser(helpers.user.manager)
        .then(function(agent) {
            return agent.post(
                "/api/tickets/" + self.ticket.get("id") + "/comments"
            )
            .set("x-csrf-token", agent.csrfToken)
            .send({
                comment: "Hidden comment",
                hidden: true
            })
            .promise();
        })
        .then(function(res) {
            self.clock.tick(1000*60);
            assert.equal(200, res.status, res.text);
            assert(res.body.hidden, "has hidden flag set");
            assert(
                !self.emitSpy.called,
                "No live update should be sent"
            );
        });

    });

    it("can be seen by managers", function() {
        var self = this;
        return helpers.loginAsUser(helpers.user.manager)
        .then(function(agent) {
            return agent.get("/api/tickets/" + self.ticket.get("id")).promise();
        })
        .then(function(res) {
            assert.equal(200, res.status, res.text);
            assert(
                _.find(res.body.comments, { comment: "Hidden comment" })
            );
        });
    });

    it("cannot be seen by normal users", function() {
        var self = this;
        return helpers.loginAsUser(helpers.user.teacher)
        .then(function(agent) {
            return agent.get("/api/tickets/" + self.ticket.get("id")).promise();
        })
        .then(function(res) {
            assert.equal(200, res.status, res.text);
            assert(
                !_.find(res.body.comments, { comment: "Hidden comment" }),
                "Hidden comment should not be present for normal users in the api"
            );
        });
    });


    it("cannot be added by normal users", function() {
        var self = this;
        return helpers.loginAsUser(helpers.user.teacher)
        .then(function(agent) {
            return agent.post(
                "/api/tickets/" + self.ticket.get("id") + "/comments"
            )
            .set("x-csrf-token", agent.csrfToken)
            .send({
                comment: "Invalid hidden comment",
                hidden: true
            })
            .promise();
        })
        .then(function(res) {
            assert.equal(403, res.status, res.text);
        });
    });

    it("are not sent with email notifications", function() {
        var self = this;
        self.clock.tick(1000 * 60 * 20);
        return request(app).post(
            "/api/emails/send/secret"
        ).send({ dummy: 1 }).promise()
        .then(function() {
            assert(
                !self.sendMailSpy.called,
                "no email should have been sent"
              );
        });
    });

});

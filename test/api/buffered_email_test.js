"use strict";

var assert = require("assert");
var Promise = require("bluebird");
var sinon = require("sinon");
var request = require("supertest");

var app = require("app/server");
var config = require("app/config");
var helpers = require("app/test/helpers");
var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");

describe("buffered email sending", function() {

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
        .spread(function(manager, teacher, otherTeacher) {
            self.manager = manager;
            self.teacher = teacher;
            self.otherTeacher = otherTeacher;

            return Promise.join(
                Ticket.create(
                    "The Ticket",
                    "Will get notifications",
                    self.teacher
                ),
                Ticket.create(
                    "An other ticket",
                    "This is other ticket without any notifications for the teacher",
                    self.otherTeacher
                ),
                Ticket.create(
                    "Yet another ticket",
                    "This is an yet another ticket",
                    self.otherTeacher
                )
            );
        })
        .spread(function(ticket, otherTicket, yetAnother) {
            self.ticket = ticket;
            self.otherTicket = otherTicket;
            self.yetAnother = yetAnother;

            return self.ticket.markAsRead(self.teacher);
        })
        .then(function() {
            return self.ticket.addComment("A comment by another teacher", self.otherTeacher);
        })
        .then(function() {
            return self.ticket.addComment("A second comment by another teacher", self.otherTeacher);
        });
    });

    beforeEach(function() {
        this.sendMailSpy = sinon.spy(config.mailTransport, "sendMail");
    });

    afterEach(function() {
        this.sendMailSpy.restore();
    });

    it("sends only the new comments", function() {
        var self = this;
        return request(app)
            .post("/api/send_emails")
            .send()
            .promise()
            .then(function(res) {
                assert.equal(200, res.status, res.text);
                assert(
                    self.sendMailSpy.called,
                    "emailTransport.sendMail was called at least once"
                );
                // XXX Assert self.sendMailSpy.args
            });
    });


});

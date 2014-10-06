"use strict";

var assert = require("assert");
var Promise = require("bluebird");
var sinon = require("sinon");
var request = require("supertest");
var multiline = require("multiline");

var helpers = require("app/test/helpers");
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
        this.clock = sinon.useFakeTimers(Date.now(), "Date");
    });

    afterEach(function() {
        this.sendMailSpy.restore();
        this.clock.restore();
    });

    it("does not allow requests without emailJobSecret", function() {
        return request(app).post("/api/emails/send/bad").send({ dummy: 1 }).promise()
        .then(function(res) {
            assert.equal(403, res.status, res.text);
         });
    });

    it("does not send email if last comment is newer than 5min", function() {
        this.clock.tick(1000 * 60 * 2);
        var self = this;
        return request(app).post("/api/emails/send/secret").send({ dummy: 1 }).promise()
        .then(function(res) {
            assert.equal(200, res.status, res.text);
            assert(!self.sendMailSpy.called);
        });
    });

    it("sends only the new comments after 5min", function() {
        this.clock.tick(1000 * 60 * 6);
        var self = this;
        return Ticket.byId(1).fetch({ require: true })
        .then(function(ticket) {
            return ticket.set({ emailSecret: "emailsecret" }).save();
        })
        .then(function() {
            return  request(app).post("/api/emails/send/secret").send({
                dummy: 1
            }).promise();
        })
        .then(function(res) {
            assert.equal(200, res.status, res.text);
            assert(
                self.sendMailSpy.called,
                "no email was sent"
            );

            var mailOb = self.sendMailSpy.args[0][0];

            assert.equal(
                "Tukipyyntö \"The Ticket\" (1) on päivittynyt",
                mailOb.subject
            );

            assert.equal(
                "Opinsys tukipalvelu <reply-to-1+emailsecret@opinsys.example>",
                mailOb.from
            );

            assert.equal(
                "Opinsys tukipalvelu <reply-to-1+emailsecret@opinsys.example>",
                mailOb.replyTo
            );

            assert.equal(multiline.stripIndent(function(){/*
                Tukipyyntösi on päivittynyt seuraavin kommentein

                Matti Meikäläinen
                A comment by another teacher
                ----------------------------------------------
                Matti Meikäläinen
                A second comment by another teacher

                ----------------------------------------------
                Pääset tarkastelemaan tukipyyntöä kokonaisuudessaan osoitteessa https://support.opinsys.fi/tickets/1
                Tämä viesti on lähetetty Opinsysin tukipalvelusta
             */}).trim(), mailOb.text.trim());

        });
    });

    it("does not send same comments twice", function() {
        this.clock.tick(1000 * 60 * 6);
        var self = this;
        return request(app).post("/api/emails/send/secret").send({ dummy: 1 }).promise()
        .then(function(res) {
            assert.equal(200, res.status, res.text);
            assert(
                !self.sendMailSpy.called,
                "no email should have been sent"
            );
        });
    });

    it("does not send emails for comments that are read on the webapp", function() {
        var self = this;
        self.clock.tick(1000 * 60 * 6);
        return self.ticket.addComment("comment read on the webapp", self.otherTeacher)
        .then(function() {
            self.clock.tick(1000 * 60 * 6);
            return self.ticket.markAsRead(self.teacher);
        })
        .then(function() {
            return request(app).post("/api/emails/send/secret").send({ dummy: 1 }).promise();
        })
        .then(function(res) {
            assert.equal(200, res.status, res.text);
            assert(!self.sendMailSpy.called, "must not send emails");
        });

    });

});

"use strict";
var Promise = require("bluebird");
var assert = require("assert");
var sinon = require("sinon");

var helpers = require("app/test/helpers");
var config = require("app/config");
var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");


describe("Ticket model", function() {

    before(function() {
        var self = this;
        return helpers.clearTestDatabase()
            .then(function() {
                return Promise.all([
                    User.ensureUserFromJWTToken(helpers.user.teacher),
                    User.ensureUserFromJWTToken(helpers.user.teacher2),
                    User.ensureUserFromJWTToken(helpers.user.manager)
                ]);
            })
            .spread(function(user, otherUser, manager) {
                self.user = user;
                self.otherUser = otherUser;
                self.manager = manager;
            });
    });

    beforeEach(function() {
        this.sendMailSpy = sinon.spy(config.mailTransport, "sendMail");
    });

    afterEach(function() {
        this.sendMailSpy.restore();
    });

    it("can be instantiated", function() {
        var self = this;
        var description = "Computer does not work :(";

        return Ticket.create("A title", description, self.user)
            .tap(function(ticket) {
                assert(
                    self.sendMailSpy.called,
                    "email was sent about the new ticket"
                );

                var email = self.sendMailSpy.args[0][0];
                assert.equal(
                    "new-tickets@opinsys.example",
                    email.to
                );
                assert.equal(
                    "Opinsys tukipalvelu <"+ ticket.getReplyEmailAddress() +">",
                    email.from
                );
                assert.equal(
                    "Opinsys tukipalvelu <"+ ticket.getReplyEmailAddress() +">",
                    email.replyTo
                );
                assert.equal(
                    'Uusi tukipyyntö "A title"',
                    email.subject
                );

                assert.equal(`
Olli Opettaja avasi uuden tukipynnön:

A title

Computer does not work :(

https://support.opinsys.fi/tickets/1
                 `.trim(), email.text.trim());


            })
            .then(function(ticket) {
                return Ticket.forge({ id: ticket.get("id") }).fetch({
                    withRelated: ["comments"]
                });
            })
            .then(function(ticket) {
                assert.equal(description, ticket.getDescription(), "the ticket can be fetched");
            })
            .then(function() {
                return Ticket.create(
                    "Other ticket title",
                    "Other ticket, by other user",
                    self.otherUser
                );
            });
    });


    it("can have comments", function() {
        var self = this;

        return Ticket.create(
            "A title",
            "computer does not work",
            self.user
        )
        .then(function(ticket) {
            return ticket.addComment("foo", self.user).return(ticket);
        })
        .then(function(ticket){
            return Ticket.forge({ id: ticket.get("id") })
                .fetch({ withRelated: "comments.createdBy" });
        })
        .then(function(ticket) {
            assert.equal(
                ticket.related("comments").length,
                2,
                "should have two comments"
            );

            assert(ticket.related("comments").find(function(m) {
                return m.get("comment") === "foo";
            }));

        });

    });

    it("has organisation:unknown tag for tickets created by email only users", function() {
        return User.ensureUserByEmail("email-only@example.com", "Evil", "Emailer")
        .then(function(user) {
            return Ticket.create("Created by email only user", "foo", user);
        })
        .then(function(ticket) {
            return ticket.load("tags");
        })
        .then(function(ticket) {
            assert(
                ticket.hasTag("organisation:unknown"),
                "has organisation:unknown tag"
            );
        });
    });

    it("status of a ticket created by normal user is pending", function() {
        var self = this;
        return Ticket.create("Ticket by normal user", "foo", self.user)
        .then(function(ticket) {
            return ticket.load("tags");
        })
        .then(function(ticket) {
            assert.equal("pending", ticket.getCurrentStatus());
        });
    });

    it("status of a ticket created by manager user is open", function() {
        var self = this;
        return Ticket.create("Ticket by normal user", "foo", self.manager)
        .then(function(ticket) {
            return ticket.load("tags");
        })
        .then(function(ticket) {
            assert.equal("open", ticket.getCurrentStatus());
        });
    });

});


"use strict";
var Promise = require("bluebird");
var assert = require("assert");
var sinon = require("sinon");
var multiline = require("multiline");

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
                    User.ensureUserFromJWTToken(helpers.user.teacher2)
                ]);
            })
            .spread(function(user, otherUser) {
                self.user = user;
                self.otherUser = otherUser;
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

                assert.equal(multiline.stripIndent(function(){/*
                    Olli Opettaja avasi uuden tukipynnön:

                    A title

                    Computer does not work :(

                    https://support.opinsys.fi/tickets/1
                 */}).trim(), email.text.trim());


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

    it("is not listed with bad visibility", function() {
        return Ticket.collection().byVisibilities(["badvisibility"])
            .fetch()
            .then(function(coll) {
                assert.equal(0, coll.size());
            });
    });

    it("has personal visibility for the creator", function() {
        return Ticket.collection().byVisibilities([this.user.getPersonalVisibility()])
            .fetch({ withRelated: "comments" })
            .then(function(coll) {
                // does not list other tickets by other users
                assert.equal(1, coll.size());
                assert.equal(
                    "Computer does not work :(",
                    coll.first().getDescription()
                );
            });
    });

    it("has organisation admin visibility", function() {
        return Ticket.collection().byVisibilities([this.user.getOrganisationAdminVisibility()])
            .fetch({ withRelated: "comments" })
            .then(function(coll) {
                assert.equal(2, coll.size(), "does list all tickets in the organisation");

                assert(coll.find(function(m) {
                    return m.getDescription() === "Computer does not work :(";
                }));

                assert(coll.find(function(m) {
                    return m.getDescription() === "Other ticket, by other user";
                }));

            });
    });

    it("ticket is not fetched in Ticket.collection().byVisibilities(...) for a soft deleted visibility", function() {
        var self = this;
        return Ticket.collection().byVisibilities([self.user.getPersonalVisibility()])
            .fetch({ withRelated: "visibilities" })
            .then(function(coll) {
                var visibility = coll.first().related("visibilities")
                .findWhere({
                    entity: self.user.getPersonalVisibility()
                });

                return visibility.softDelete(self.user);
            })
            .then(function() {
                return Ticket.collection().byVisibilities([self.user.getPersonalVisibility()]).fetch();
            })
            .then(function(coll) {
                assert.equal(0, coll.size());
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

});


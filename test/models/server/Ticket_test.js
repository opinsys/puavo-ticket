"use strict";
var Promise = require("bluebird");

var helpers = require("../../helpers");

var Ticket = require("../../../models/server/Ticket");
var ReadTicket = require("../../../models/server/ReadTicket");
var User = require("../../../models/server/User");
var assert = require("assert");


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

    it("can be instantiated", function() {
        var self = this;
        var description = "Computer does not work :(";

        return Ticket.create("A title", description, self.user)
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
        return Ticket.byVisibilities(["badvisibility"])
            .fetch()
            .then(function(coll) {
                assert.equal(0, coll.size());
            });
    });

    it("has personal visibility for the creator", function() {
        return Ticket.byVisibilities([this.user.getPersonalVisibility()])
            .fetch({ withRelated: "comments" })
            .then(function(coll) {
                assert.equal(1, coll.size(), "does not list other tickets by other users");
                assert.equal(
                    "Computer does not work :(",
                    coll.first().getDescription()
                );
            });
    });

    it("has organisation admin visibility", function() {
        return Ticket.byVisibilities([this.user.getOrganisationAdminVisibility()])
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

    it("ticket is not fetched in Ticket.byVisibilities(...) for a soft deleted visibility", function() {
        var self = this;
        return Ticket.byVisibilities([self.user.getPersonalVisibility()])
            .fetch({ withRelated: "visibilities" })
            .then(function(coll) {
                var visibility = coll.first().related("visibilities")
                .findWhere({
                    entity: self.user.getPersonalVisibility()
                });

                return visibility.softDelete(self.user);
            })
            .then(function() {
                return Ticket.byVisibilities([self.user.getPersonalVisibility()]).fetch();
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

    it("can be marked as read or unread", function() {
        var self = this;

        var testTicket = null;

        return Ticket.create(
                "Ticket title to be read",
                "Will be read",
                self.user
            )
            .then(function(ticket) {
                return ticket.markAsRead(self.user).return(ticket);
            })
            .then(function(ticket) {
                testTicket = ticket;

                return ReadTicket.forge({
                    ticketId: ticket.get("id")
                }).fetch({ require: true });
            })
            .then(function(read) {
                assert(read);
                assert.equal(
                    self.user.get("id"),
                    read.get("readById"),
                    "has the reader id in the readBy column"
                );
            })
            .then(function() {
                return testTicket.markAsUnread().return(testTicket);
            })
            .then(function(ticket) {
                return ReadTicket.forge({
                    ticketId: ticket.get("id")
                }).fetch({ require: true });
            })
            .then(function(read) {
                assert(read);
                assert.equal(
                    self.user.get("id"),
                    read.get("readById"),
                    "has the reader id in the readById column"
                );
                assert.equal(read.get("unread"), true);
            });
    });

});


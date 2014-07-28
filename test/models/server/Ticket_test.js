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

        return Ticket.forge({
                description: description,
                createdById: self.user.get("id")
            })
            .save()
            .then(function(ticket) {
                return Ticket.forge({ id: ticket.get("id") }).fetch();
            })
            .then(function(ticket) {
                assert.equal(description, ticket.get("description"), "the ticket can be fetched");
            })
            .then(function() {
                return Ticket.forge({
                        description: "Other ticket, by other user",
                        createdById: self.otherUser.get("id")
                }).save();
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
            .fetch()
            .then(function(coll) {
                assert(coll.findWhere({ description: "Computer does not work :(" }));
                assert.equal(1, coll.size(), "does not list other tickets by other users");
            });
    });

    it("has organisation admin visibility", function() {
        return Ticket.byVisibilities([this.user.getOrganisationAdminVisibility()])
            .fetch()
            .then(function(coll) {
                assert(coll.findWhere({ description: "Computer does not work :(" }));
                assert(coll.findWhere({ description: "Other ticket, by other user" }));
                assert.equal(2, coll.size(), "does list all tickets in the organisation");
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
        var ticketId = Ticket.forge({
            description: "computer does not work",
            createdById: self.user.id
        })
        .save()
        .then(function(ticket) {
            return ticket.addComment("foo", self.user)
                .then(function() { return ticket.get("id"); });
        });

        return ticketId.then(function(id) {
            return Ticket.forge({ id: id })
                .fetch({ withRelated: "comments.createdBy" })
                .then(function(ticket) {
                    assert.equal(
                        ticket.related("comments").length,
                        1,
                        "should have one comment"
                    );

                    var comment = ticket.related("comments").models[0];

                    assert.equal(comment.get("comment"), "foo");
                });
        });

    });

    it("can be edited", function() {
        var id;
        return Ticket.collection().fetch()
            .then(function(coll) {
                var ticket = coll.first();
                id = ticket.get("id");
                ticket.set("description", "new description");
                return ticket.save();
            })
            .then(function() {
                return Ticket.forge({ id: id }).fetch();
            })
            .then(function(ticket) {
                assert.equal(ticket.get("description"), "new description");
            });
    });

    it("can be marked as read or unread", function() {
        var self = this;

        var testTicket = null;

        return Ticket.forge({
                description: "Will be read",
                createdById: self.user.id
            })
            .save()
            .then(function(ticket) {
                return ticket.markAsRead(self.user)
                    .then(function() { return ticket; });
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
                return testTicket.markAsUnread()
                    .then(function() { return testTicket; });

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


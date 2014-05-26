"use strict";
var Promise = require("bluebird");

var helpers = require("../../helpers");

var Ticket = require("../../../models/server/Ticket");
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
        var title = "Computer does not work :(";

        return Ticket.forge({
                title: title,
                description: "It just doesn't",
                created_by: self.user.get("id")
            })
            .save()
            .then(function(ticket) {
                return Ticket.forge({ id: ticket.get("id") }).fetch();
            })
            .then(function(ticket) {
                 assert.equal(title, ticket.get("title"), "the ticket can be fetched");
            })
            .then(function() {
                return Ticket.forge({
                        title: "Other ticket",
                        description: "by other user",
                        created_by: self.otherUser.get("id")
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
                assert(coll.findWhere({ title: "Computer does not work :(" }));
                assert.equal(1, coll.size(), "does not list other tickets by other users");
            });
    });

    it("has organisation admin visibility", function() {
        return Ticket.byVisibilities([this.user.getOrganisationAdminVisibility()])
            .fetch()
            .then(function(coll) {
                assert(coll.findWhere({ title: "Computer does not work :(" }));
                assert(coll.findWhere({ title: "Other ticket" }));
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
            title: "computer does not work",
            description: "It just doesn't",
            created_by: self.user.id
        })
        .save()
        .then(function(ticket) {
            return ticket.addComment({
                    comment: "foo",
                    created_by: self.user.id
                })
                .then(function() {
                    return ticket.get("id");
                });
        });

        return ticketId.then(function(id) {
            return Ticket.forge({ id: id })
                .fetch({ withRelated: "comments" })
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
                ticket.set("title", "new title");
                return ticket.save();
            })
            .then(function() {
                return Ticket.forge({ id: id }).fetch();
            })
            .then(function(ticket) {
                assert.equal(ticket.get("title"), "new title");
            });
    });

});


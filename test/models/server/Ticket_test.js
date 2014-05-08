"use strict";
var Promise = require("bluebird");

var helpers = require("../../helpers");

var Ticket = require("../../../models/server/Ticket");
var assert = require("assert");


describe("Ticket model", function() {

    before(function() {
        var self = this;
        return helpers.clearTestDatabase()
            .then(function() {
                return helpers.loginAsUser(helpers.user.teacher);
            })
            .then(function(agent) {
                self.agent = agent;

                return helpers.fetchTestUser();
            })
            .then(function(user) {
                self.user = user;
            });
    });

    it("Instance can be created", function() {
        var self = this;
        var title = "Computer does not work :(";

        return Ticket.forge({
                title: title,
                description: "It just doesn't",
                creator_user_id: self.user.id
            })
            .save()
            .then(function(ticket) {
                return Ticket.forge({ id: ticket.get("id") }).fetch();
            })
            .then(function(ticket) {
                 assert.equal(title, ticket.get("title"));
            });

    });

    it("can have comments", function() {
        var self = this;
        var ticketId = Ticket.forge({
            title: "computer does not work",
            description: "It just doesn't",
            creator_user_id: self.user.id
        })
        .save()
        .then(function(ticket) {
            return ticket.addComment({
                    comment: "foo",
                    creator_user_id: self.user.id
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

    describe("visibilities", function() {

        it("can be set for tickets", function() {
            var self = this;
            var withVisibility = Ticket.forge({
                title: "With visibility",
                description: "desc",
                creator_user_id: self.user.id
            })
            .save()
            .then(function(ticket) {
                return ticket.addVisibility({
                    entity: "school:1",
                    comment: "This ticket affects whole school",
                    creator_user_id: self.user.id
                });
            });

            var otherTickets = [
                { title: "foo1", description: "bar", creator_user_id: self.user.id },
                { title: "foo2", description: "bar", creator_user_id: self.user.id },
                { title: "foo2", description: "bar", creator_user_id: self.user.id }
            ].map(function(data) {
                return Ticket
                    .forge(data)
                    .save()
                    .then(function(ticket) {
                        return ticket.addVisibility({
                            entity: "bad",
                            comment: "for the other ticket",
                            creator_user_id: self.user.id
                        });
                    });
            });

            return withVisibility
                .then(function() {
                    return Promise.all(otherTickets);
                })
                .then(function() {
                    return Ticket.fetchByVisibility(["school:1"]);
                })
                .then(function(coll) {
                    assert.equal(1, coll.size());
                    assert.equal("With visibility", coll.first().get("title"));
                });

        });

    });

});


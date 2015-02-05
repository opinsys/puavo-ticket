"use strict";

var Promise = require("bluebird");
var assert = require("assert");

var helpers = require("app/test/helpers");
var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");

describe("Follower model", function() {
    var manager, teacher, teacher2, ticket;

    before(function() {
        return helpers.clearTestDatabase()
        .then(() => Promise.join(
            User.ensureUserFromJWTToken(helpers.user.manager)
            .then((u) => manager = u),

            User.ensureUserFromJWTToken(helpers.user.teacher)
            .then((u) => teacher = u),

            User.ensureUserFromJWTToken(helpers.user.teacher2)
            .then((u) => teacher2 = u)
        ))

        .then(() => Ticket.create(
            "A handler test title",
            "Handler test ticket",
            teacher
        ))
        .then((t) => ticket = t);
    });


    describe("added using Ticket#addFollower(...)", function() {
        before(() => ticket.addFollower(teacher2, manager));

        it("is visible in Ticket#followers()", function() {
             return ticket.followers().fetch({
                withRelated: "follower"
            })
            .then(function(followers) {
                var usernames = followers.map((f) =>
                    f.relations.follower.getUsername()
                );

                // Creator and the new follower is present
                assert.deepEqual(
                    ["olli.opettaja", "matti.meikalainen"].sort(),
                    usernames.sort()
                );
            });
        });

        it("cannot be duplicated", function() {
            return ticket.addFollower(teacher2, manager)
            .then((follower) => ticket.followers().fetch({
                withRelated: "follower"
            }))
            .then(function(followers) {
                var usernames = followers.map((f) =>
                    f.relations.follower.getUsername()
                );

                // No changes from the previous
                assert.deepEqual(
                    ["olli.opettaja", "matti.meikalainen"].sort(),
                    usernames.sort()
                );
            });
        });

        it("adds corresponding tag", function() {
            return ticket.tags().query((q) => q.where({
                deleted: 0,
                tag: "follower:" + teacher2.get("id")
            }))
            .fetch()
            .then(function(tags) {
                assert.equal(1, tags.size());
            });
        });

    });

    describe("removed using Ticket#removeFollower(...)", function() {
        before(() => ticket.removeFollower(teacher2, manager));

        it("removes follower from Ticket#followers()", function() {
             return ticket.followers().fetch({
                withRelated: "follower"
            })
            .then(function(followers) {
                var usernames = followers.map((f) =>
                    f.relations.follower.getUsername()
                );

                // Creator and the new follower is present
                assert.deepEqual(["olli.opettaja"], usernames);
            });
        });

        it("removes corresponding tag", function() {
            return ticket.tags().query((q) => q.where({
                deleted: 0,
                tag: "follower:" + teacher2.get("id")
            }))
            .fetch()
            .then(function(tags) {
                assert.equal(0, tags.size());
            });
        });

    });

});

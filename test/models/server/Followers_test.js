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

    it("can be added for a ticket", function() {
        return ticket.addFollower(teacher2, manager)
        .then((follower) =>
             ticket.followers().fetch({
                withRelated: "follower"
            })
        )
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

    it("does not make duplicates", function() {
        return ticket.addFollower(teacher2, manager)
        .then((follower) =>
            ticket.followers().fetch({
                withRelated: "follower"
            })
        )
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


});

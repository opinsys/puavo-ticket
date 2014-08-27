"use strict";

var Promise = require("bluebird");
var assert = require("assert");

var helpers = require("app/test/helpers");
var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");

describe("Follower model", function() {

    before(function() {
        var self = this;
        return helpers.clearTestDatabase()
            .then(function() {
                return Promise.all([
                    User.ensureUserFromJWTToken(helpers.user.manager),
                    User.ensureUserFromJWTToken(helpers.user.teacher),
                    User.ensureUserFromJWTToken(helpers.user.teacher2)
                ]);
            })
            .spread(function(manager, user, otherUser) {
                self.manager = manager;
                self.user = user;
                self.otherUser = otherUser;

                return Ticket.create(
                    "A handler test title",
                    "Handler test ticket",
                    self.user
                );
            })
            .then(function(ticket) {
                self.ticket = ticket;
            });
    });

    it("can be added for a ticket", function() {
        var self = this;
        return self.ticket.addFollower(self.otherUser, self.manager)
            .then(function(follower) {
                return self.ticket.followers().fetch({
                    withRelated: "follower"
                });
            })
            .then(function(followers) {
                var usernames = followers.map(function(f) {
                    return f.relations.follower.getUsername();
                });

                // Creator and the new follower is present
                assert.deepEqual(
                    ["olli.opettaja", "matti.meikalainen"],
                    usernames
                );
            });
    });

    it("does not make duplicates", function() {
        var self = this;
        return self.ticket.addFollower(self.otherUser, self.manager)
            .then(function(follower) {
                return self.ticket.followers().fetch({
                    withRelated: "follower"
                });
            })
            .then(function(followers) {
                var usernames = followers.map(function(f) {
                    return f.relations.follower.getUsername();
                });

                // No changes from the previous
                assert.deepEqual(
                    ["olli.opettaja", "matti.meikalainen"],
                    usernames
                );
            });
    });


});

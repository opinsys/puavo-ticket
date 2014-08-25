"use strict";
var helpers = require("../../helpers");

// var Comment = require("../../../models/server/Comment");
var Ticket = require("../../../models/server/Ticket");
var assert = require("assert");

describe("Comment model", function() {

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

    it("instance can be created from Ticket", function() {
        var self = this;
        return Ticket.create(
                "A title",
                "Computer does not work",
                self.user
            )
            .then(function(ticket) {
                self.ticket = ticket;
                return ticket.addComment("foo", self.user);
            })
            .then(function() {
                return self.ticket.comments().fetch({
                        withRelated: "createdBy"
                    });
            })
            .then(function(comments) {
                assert(comments.find(function(m) {
                    return m.get("comment") === "foo";
                }));
            });
    });

});

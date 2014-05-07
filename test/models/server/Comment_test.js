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
        return Ticket.forge({
                title: "Computer does not work",
                description: "It just doesn't",
                user_id: self.user.get("id")
            })
            .save()
            .then(function(ticket) {
                self.ticket = ticket;
                return ticket.addComment({
                        comment: "foo",
                        user_id: self.user.get("id")
                    });
            })
            .then(function() {
                return self.ticket.comments().fetch({
                        withRelated: "createdBy"
                    });
            })
            .then(function(comments) {
                var commentCreator = comments.first().related("createdBy");
                assert.equal("Olli", commentCreator.get("external_data").first_name);
            });
    });

});

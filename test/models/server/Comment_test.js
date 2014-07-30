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
                description: "Computer does not work",
                createdById: self.user.get("id")
            })
            .save()
            .then(function(ticket) {
                return ticket.addTitle("A title", self.user)
                    .return(ticket);
            })
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
                var commentCreator = comments.first().related("createdBy");
                assert.equal("Olli", commentCreator.get("externalData").first_name);
            });
    });

});

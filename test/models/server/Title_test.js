"use strict";
var helpers = require("../../helpers");

var Ticket = require("../../../models/server/Ticket");
var assert = require("assert");

describe("Title model", function() {

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
                createdById: self.user.get("id")
            })
            .save()
            .then(function(ticket) {
                self.ticket = ticket;
                return ticket.addTitle("Computer does not work", self.user);
            })
            .then(function() {
                return self.ticket.titles().fetch({
                        withRelated: "createdBy"
                    });
            })
            .then(function(titles) {
                var titleCreator = titles.first().related("createdBy");
                assert.equal("Olli", titleCreator.get("externalData").first_name);
            });
    });

});

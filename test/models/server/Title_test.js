"use strict";
var assert = require("assert");
var Promise = require("bluebird");

var helpers = require("../../helpers");
var Ticket = require("../../../models/server/Ticket");
var User = require("../../../models/server/User");

describe("Title model", function() {

    before(function() {
        var self = this;
        return helpers.clearTestDatabase()
            .then(function() {
                return Promise.join(
                    User.ensureUserFromJWTToken(helpers.user.manager),
                    User.ensureUserFromJWTToken(helpers.user.teacher),
                    User.ensureUserFromJWTToken(helpers.user.teacher2)
                );
            })
            .spread(function(manager, user, otherUser) {
                self.manager = manager;
                self.user = user;
                self.otherUser = otherUser;

                return helpers.loginAsUser(helpers.user.teacher);
            })
            .then(function(agent) {
                self.agent = agent;
            });

    });

    it("instance can be created from Ticket", function() {
        var self = this;
        return Ticket.create(
                "Computer does not work",
                "It just doesn't",
                self.user
            ).then(function(ticket) {
                self.ticket = ticket;
                return self.ticket.titles().fetch({
                        withRelated: "createdBy"
                    });
            })
            .then(function(titles) {
                var titleCreator = titles.first().related("createdBy");
                assert.equal("Olli", titleCreator.get("externalData").first_name);
            });
    });

    it("other users cannot add titles", function() {
        var self = this;
        var catchCalled = false;
        return self.ticket.addTitle("bad user", self.otherUser)
            .catch(function(err) {
                assert.equal(
                    "Only handlers can add titles",
                    err.message
                );
                catchCalled = true;
            })
            .then(function() {
                assert(catchCalled, "catch was not called");
            });
    });


});

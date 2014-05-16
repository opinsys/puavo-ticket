"use strict";

var assert = require("assert");
var Promise = require("bluebird");

var helpers = require("../../helpers");
var Visibility= require("../../../models/server/Visibility");
var Ticket = require("../../../models/server/Ticket");
var User = require("../../../models/server/User");
var Base = require("../../../models/server/Base");


describe("Visibility model", function() {

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

                return Ticket.forge({
                    title: "Title",
                    description: "Desc",
                    created_by: user.get("id")
                }).save();
            })
            .then(function(ticket) {
                self.ticket = ticket;
            });
    });

    it("is given to ticket creator implicitly", function() {
        var self = this;
        return self.ticket.visibilities().fetch()
            .then(function(visibilities) {

                assert(
                    Visibility.hasVisibility(
                        self.user.getPersonalVisibility(),
                        visibilities
                    )
                );

            });
    });

    it("can be added explicitly from the ticket", function() {
        var self = this;
        return self.ticket.addVisibility(
                self.otherUser.getPersonalVisibility(),
                self.user
            )
            .then(function() {
                return self.ticket.visibilities().fetch();
            })
            .then(function(visibilities) {

                assert(
                    Visibility.hasVisibility(
                        self.otherUser.getPersonalVisibility(),
                        visibilities
                    )
                );

            });
    });

    it("does not allow duplicate visibilities for the same ticket", function(done) {

        this.ticket.addVisibility(
            this.otherUser.getPersonalVisibility(),
            this.user
        )
        .catch(Base.isUniqueConstraintError, function(err) {
            assert(err);
            done(); // use done() to assert that this assert is ran
        })
        .catch(done);

    });

});

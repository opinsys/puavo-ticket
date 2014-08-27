"use strict";

var helpers = require("app/test/helpers");
var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");


describe("Base#softDelete()", function() {

    before(function() {
        var self = this;
        return helpers.clearTestDatabase()
            .then(function() {
                return User.ensureUserFromJWTToken(helpers.user.teacher);
            })
            .then(function(user) {
                self.user = user;
                return Ticket.create("A title", "Desc", user);
            })
            .then(function(ticket) {
                self.ticket = ticket;
            });
    });

    it("can delete the first tag", function() {
        var self = this;
        return self.ticket.addTag("foo", self.user)
            .then(function (tag) {
                return tag.softDelete(self.user);
            });
    });

    it("allows readding the first tag and can delete it again", function() {
        var self = this;
        return self.ticket.addTag("foo", self.user)
            .then(function(tag) {
                return tag.softDelete(self.user);
            });
    });

    // TODO some assertions!

});

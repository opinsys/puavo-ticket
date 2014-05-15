"use strict";

var assert = require("assert");
var Promise = require("bluebird");

var helpers = require("../../helpers");
var User = require("../../../models/server/User");

describe("Handler model", function() {

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
                return helpers.insertTestTickets(user);
            })
            .then(function(tickets) {
                self.ticket = tickets.ticket;
                self.otherTicket = tickets.otherTicket;
            });
    });

    it("can be added from a ticket", function() {
        var self = this;

        return User.byExternalId(helpers.user.teacher2.id)
            .fetch({ require: true })
            .then(function(otherUser) {
                return self.ticket.addHandler(otherUser, self.user);
            })
            .then(function() {
                return self.ticket.handlers().fetch({
                        withRelated: [ "handler" ]
                    });
            })
            .then(function(handlers) {
                handlers = handlers.toJSON();
                assert.equal(1, handlers.length, "has one handler");
                assert.equal(self.user.id, handlers[0].created_by);
                assert.equal(self.otherUser.id, handlers[0].handler.id);
                assert.equal("matti.meikalainen", handlers[0].handler.external_data.username);

                return self.ticket.visibilities().fetch();
            });

    });
});

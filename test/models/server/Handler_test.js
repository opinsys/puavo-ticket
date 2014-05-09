"use strict";

var helpers = require("../../helpers");

var assert = require("assert");

describe("Handler model", function() {

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

                return helpers.insertTestTickets(user);
            })
            .then(function(tickets) {
                self.ticket = tickets.ticket;
                self.otherTicket = tickets.otherTicket;
            });
    });

    it("can be added from a ticket", function() {
        var self = this;

        return self.ticket.addHandler(self.user, self.user)
            .then(function() {
                return self.ticket.handlers().fetch({
                        withRelated: [ "handler" ]
                    });
            })
            .then(function(handlers) {
                handlers = handlers.toJSON();
                assert.equal(1, handlers.length, "has one handler");
                assert.equal(self.user.id, handlers[0].created_by);
                assert.equal(self.user.id, handlers[0].handler.id);
                assert.equal("olli.opettaja", handlers[0].handler.external_data.username);
            });



    });
});

"use strict";

var assert = require("assert");
var Promise = require("bluebird");

var helpers = require("../../helpers");
var User = require("../../../models/server/User");

describe("Ticket handlers", function() {

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

    it("new tickets has an implicit 'nohandlers' tag", function() {
        return this.ticket.tags().fetch().then(function(tags) {
            var tagStrings = tags.pluck("tag");
            assert(tagStrings.indexOf("nohandlers") !== -1);
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
                assert.equal(
                    "matti.meikalainen",
                    handlers[0].handler.external_data.username
                );
            });

    });

    it("personal visibility is given to the handler", function() {
        var self = this;

        return self.ticket.visibilities().fetch()
            .then(function(visibilities) {
                visibilities = visibilities.map(function(v) {
                    return v.get("entity");
                });

                assert(visibilities.indexOf(self.otherUser.getPersonalVisibility()) !== -1);
            });
    });

    it("'nohandlers' tag is removed", function() {
        return this.ticket.tags().fetch().then(function(tags) {
            var tag = tags.findWhere({ tag: "nohandlers" });
            assert(tag);
            assert(tag.isSoftDeleted());
        });
    });


});

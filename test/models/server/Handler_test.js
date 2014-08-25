"use strict";

var assert = require("assert");
var Promise = require("bluebird");
var _ = require("lodash");

var helpers = require("../../helpers");
var User = require("../../../models/server/User");
var Ticket = require("../../../models/server/Ticket");

describe("Ticket handlers", function() {

    before(function() {
        var self = this;
        return helpers.clearTestDatabase()
            .then(function() {
                return Promise.all([
                    User.ensureUserFromJWTToken(helpers.user.manager),
                    User.ensureUserFromJWTToken(helpers.user.teacher),
                    User.ensureUserFromJWTToken(helpers.user.teacher2)
                ]);
            })
            .spread(function(manager, user, otherUser) {
                self.manager = manager;
                self.user = user;
                self.otherUser = otherUser;

                return Ticket.create(
                    "A title handler",
                    "Handler test ticket",
                    self.user
                );
            })
            .then(function(ticket) {
                self.ticket = ticket;
            });
    });

    it("can be added from a ticket", function() {
        var self = this;

            return self.ticket.addHandler(self.otherUser, self.manager)
            .then(function() {
                return self.ticket.handlers().fetch({
                        withRelated: [ "handler" ]
                    });
            })
            .then(function(handlers) {
                handlers = handlers.toJSON();

                var handler = _.find(handlers, function(h) {
                    return h.handler.id === self.otherUser.id;
                });

                assert(handler, "has the other user as handler");

                assert.equal(
                    handler.createdById,
                    self.manager.get("id"),
                    "manager is the creator"
                );


            });
    });

    it("returns true (promise) from Ticket#isHandler(user) for handlers", function() {
        var self = this;
        return Promise.all([
            User.byExternalId(helpers.user.teacher.id).fetch({ require: true }),
            self.ticket.load("handlerUsers")
        ])
        .spread(function(user) {
            assert(self.ticket.isHandler(user) === true);
        });
    });

    it("only managers can add handlers", function() {
        var self = this;

        return User.ensureUserFromJWTToken(helpers.user.teacher3)
            .then(function(normalUser) {
                return self.ticket.addHandler(normalUser, normalUser)
                    .catch(function(err) {
                        return err;
                    })
                    .then(function(err) {
                        assert(err instanceof Error, "must have error");
                        assert.equal("Only managers or owners can add handlers", err.message);
                    });
            });
    });


    it("personal visibility is given to the handler", function() {
        var self = this;

        return self.ticket.visibilities().fetch()
            .then(function(visibilities) {
                visibilities = visibilities.map(function(v) {
                    return v.get("entity");
                });

                assert(visibilities.indexOf(self.user.getPersonalVisibility()) !== -1);
            });
    });


});

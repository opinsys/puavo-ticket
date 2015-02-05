"use strict";

var assert = require("assert");
var Promise = require("bluebird");
var _ = require("lodash");

var helpers = require("app/test/helpers");
var User = require("app/models/server/User");
var Ticket = require("app/models/server/Ticket");

describe("Ticket handlers", function() {

    var manager, teacher, teacher2, ticket;

    before(() =>
       helpers.clearTestDatabase()
       .then(() => Promise.join(
           User.ensureUserFromJWTToken(helpers.user.manager)
           .then((u) => manager = u),

            User.ensureUserFromJWTToken(helpers.user.teacher)
            .then((u) => teacher = u),

            User.ensureUserFromJWTToken(helpers.user.teacher2)
            .then((u) => teacher2 = u)
       ))
       .then(() => Ticket.create(
            "A title handler",
            "Handler test ticket",
            teacher
       ))
       .then((t) => ticket = t)

    );


    it("can be added from a ticket", () =>
        ticket.addHandler(teacher2, manager)
        .then(() => ticket.handlers().fetch({
            withRelated: "handler"
        }))
        .then((handlers) => {
            handlers = handlers.toJSON();

            var handler = _.find(handlers, (h) =>
                h.handler.id === teacher2.id
            );

            assert(handler, "has the other user as handler");

            assert.equal(
                handler.createdById,
                manager.get("id"),
                "manager is the creator"
            );

        })
    );

    it("returns true (promise) from Ticket#isHandler(user) for handlers", () =>
        Promise.join(
            User.byExternalId(helpers.user.teacher.id).fetch({ require: true }),
            ticket.load("handlerUsers")
        )
        .spread((user) => {
            assert(ticket.isHandler(user) === true);
        })
    );


    it("personal visibility is given to the handler", () =>
        ticket.visibilities().fetch()
        .then((visibilities) => {
            visibilities = visibilities.map((v) => v.get("entity"));
            assert(visibilities.indexOf(teacher.getPersonalVisibility()) !== -1);
        })
    );


});

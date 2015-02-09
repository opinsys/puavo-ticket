"use strict";

var assert = require("assert");
var Promise = require("bluebird");

var helpers = require("app/test/helpers");
var User = require("app/models/server/User");
var Ticket = require("app/models/server/Ticket");

describe("Handler model", function() {

    var manager, teacher, teacher2, ticket;

    before(() => {
       return helpers.clearTestDatabase()
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
       .then((t) => ticket = t);

    });

    describe("added using Ticket#addHandler(...)", () => {
        before(() => ticket.addHandler(teacher2, manager));

        it("is visible in Ticket#handlers()", () => {

           return ticket.handlers()
           .query((q) => q.where({handler: teacher2.get("id")}))
           .fetchOne({ withRelated: "handler", require: true })

            .then((handler) => {
                assert.equal(teacher2.get("id"), handler.get("handler"));
                assert.equal(
                    handler.get("createdById"),
                    manager.get("id"),
                    "manager is the creator"
                );
            });
        });

        it("makes Ticket#isHandler(user) return true for the handler", () => {
            return Promise.join(
                User.byExternalId(helpers.user.teacher.id).fetch({ require: true }),
                ticket.load("handlerUsers")
            )
            .spread((user) => {
                assert(ticket.isHandler(user) === true);
            });
        });

        it("adds user:<id> tag for the ticket", () => {
            return ticket.tags().query({where:{deleted: 0}}).fetch()
            .then((tags) => {
                assert(tags.findWhere({ tag: "user:" + teacher.get("id") }));
            });
        });


    });

    describe("removed using Ticket#removeHandler(...)", () => {
        before(() => ticket.removeHandler(teacher2, manager));

        it("sets as soft deleted in Ticket#handlers()", () => {
            return ticket.handlers()
           .query({where:{handler: teacher2.get("id"), deleted:0 }})
           .fetchOne()
           .then((handler) => assert(!handler));
        });

        it("other handlers are not removed", () => {
            return ticket.handlers().query({where:{deleted: 0}}).fetch()
            .then((handlers) => {
                assert(handlers.size() > 0);
            });
        });

        it("other handlers tags are not removed", () => {
            return ticket.tags().query({where:{deleted: 0}}).fetch()
            .then((tags) => {
                assert(tags.size() > 0);
            });
        });
    });

});

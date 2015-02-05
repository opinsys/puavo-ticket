"use strict";

var Promise = require("bluebird");
var assert = require("assert");

var helpers = require("../../../test/helpers");
var Ticket = require("../../../models/server/Ticket");
var User = require("../../../models/server/User");

describe("Access tags: User", function() {

    var ticket, manager, teacher, teacher2;

    before(function() {
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
            "A title",
            "This ticket has some tags",
            manager
        ))
        .then((t) => ticket = t)
        .then((t) => t.addTag("foo", manager))
        .then(() => teacher.load("accessTags"));
    });

    describe("on creation", function() {

        it("has follower access tag", function() {
            assert(
                teacher.rel("accessTags")
                .findWhere({ tag: "follower:" + teacher.get("id") })
            );
        });

        it("has handler access tag", function() {
            assert(
                teacher.rel("accessTags")
                .findWhere({ tag: "handler:" + teacher.get("id") })
            );
        });

    });

    describe("without matching access tag", function() {

        var tickets;

        before(function() {
            return Ticket.collection().withAccessTags(teacher).fetch()
            .then(function(_tickets) {
                tickets = _tickets;
            });
        });

        it("tickets are not listed", function() {
            assert.equal(0, tickets.size());
        });

    });

    describe("with matching access tag", function() {

        var tickets;

        before(function() {
            return teacher.addAccessTag("foo", manager)
            .then(function() {
                return Ticket.collection().withAccessTags(teacher).fetch();
            })
            .then(function(_tickets) {
                tickets = _tickets;
            });
        });

        it("tickets are listed", function() {
            assert.equal(1, tickets.size());
        });

    });

    describe("method User#addAccessTag()", function() {
        it("can be called multiple times for the same tag", function() {
            return teacher.addAccessTag("foo", manager);
        });
    });

    describe("elsewhere without matching AccessTags", function() {

        var tickets;

        before(() =>
            Ticket.collection().withAccessTags(teacher2).fetch()
            .then((_tickets) => tickets = _tickets)
        );

        it("don't get tickets", function() {
            assert.equal(0, tickets.size());
        });

    });

    describe("with soft deleted AccessTags", function() {

        var tickets;

        before(function() {
            return teacher.removeAccessTag("foo", manager)
            .then(function() {
                return Ticket.collection().withAccessTags(teacher).fetch();
            })
            .then(function(_tickets) {
                tickets = _tickets;
            });
        });

        it("tickets are not listed", function() {
            assert.equal(0, tickets.size());
        });

    });

    describe("with soft deleted ticket tags", function() {

        var tickets;

        before(function() {
            return teacher.addAccessTag("foo", manager) // restore access tag
            .then(function() {
                return ticket.removeTag("foo", manager);
            })
            .then(function() {
                return Ticket.collection().withAccessTags(teacher).fetch();
            })
            .then(function(_tickets) {
                tickets = _tickets;
            });
        });

        it("tickets are not listed", function() {
            assert.equal(0, tickets.size());
        });

    });


});

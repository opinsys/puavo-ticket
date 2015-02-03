"use strict";

var Promise = require("bluebird");
var assert = require("assert");

var helpers = require("../../../test/helpers");
var Ticket = require("../../../models/server/Ticket");
var User = require("../../../models/server/User");

describe("AccessTags on users:", function() {

    var ticket, manager, teacher, teacher2;

    before(function() {
        return helpers.clearTestDatabase()
            .then(function() {
                return Promise.join(
                    User.ensureUserFromJWTToken(helpers.user.manager),
                    User.ensureUserFromJWTToken(helpers.user.teacher),
                    User.ensureUserFromJWTToken(helpers.user.teacher2)
                );
            })
            .spread(function(_manager, _teacher, _teacher2){
                manager = _manager;
                teacher = _teacher;
                teacher2 = _teacher2;

                return Ticket.create(
                    "A title",
                    "This ticket has some tags",
                    manager
                );
            })
            .then(function(_ticket) {
                ticket = _ticket;

                return ticket.addTag("foo", manager);
            });
    });

    describe("without matching AccessTag", function() {

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

    describe("with matching AccessTag", function() {

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

    describe("User#addAccessTag()", function() {
        it("can be called multiple times for the same tag", function() {
            return teacher.addAccessTag("foo", manager);
        });
    });

    describe("other users without matching AccessTags", function() {

        var tickets;

        before(function() {
            return Ticket.collection().withAccessTags(teacher2).fetch()
            .then(function(_tickets) {
                tickets = _tickets;
            });
        });

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

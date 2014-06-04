"use strict";

var helpers = require("../../helpers");

var Ticket = require("../../../models/server/Ticket");
var assert = require("assert");

describe("Tag model", function() {

    before(function() {
        var self = this;
        return helpers.clearTestDatabase()
            .then(function() {
                return helpers.loginAsUser(helpers.user.teacher);
            })
            .then(function() {
                return helpers.fetchTestUser();
            })
            .then(function(user) {
                self.user = user;

                return Ticket.forge({
                        created_by: self.user.get("id"),
                        title: "Tag test ticket",
                        description: "This ticket has some tags"
                    }).save();
            })
            .then(function(ticket) {
                self.ticketId = ticket.get("id");
            });
    });

    it("can be added for a ticket", function() {
        var self = this;
        var ticket;

        return Ticket.byId(this.ticketId).fetch()
            .then(function(_ticket) {
                ticket = _ticket;
                return ticket.addTag("footag", self.user)
                    .then(function() {
                        return ticket.addTag("othertag", self.user);
                    });
            })
            .then(function() {
                return ticket.tags().fetch();
            })
            .then(function(tags) {

                tags = tags.filter(function(update) {
                    return update.get("tag") === "footag";
                });

                assert.equal(1, tags.length, "has footag");

                var tag = tags[0];
                assert.equal(
                    self.user.get("id"),
                    tag.get("created_by"),
                    "has correct creator"
                );

            });
    });

    it("cannot have multiple instances of the same tag", function(done) {
        var self = this;
        var catchExecuted = false;

        Ticket.byId(this.ticketId).fetch()
        .then(function(ticket) {
            return ticket.addTag("footag", self.user);
        })
        .catch(function(err) {
            catchExecuted = true;
            assert.equal("tag footag already exists", err.message);
        })
        .then(function() {
            assert(catchExecuted, "catch was not executed");
            done();
        }).catch(done);
    });

    it("other tickets can have the same tag", function() {
        var self = this;
        return Ticket.forge({
                created_by: self.user.get("id"),
                title: "Other tag test ticket",
                description: "This ticket also has some tags"
            })
            .save()
            .then(function(ticket) {
                return ticket.addTag("footag", self.user)
                    .then(function() {
                        return ticket.tags().fetch();
                    });
            })
            .then(function(tags) {
                assert(tags.findWhere({ tag: "footag" }));
            });
    });

    it("tag can be removed", function() {
        var self = this;
        var ticket;
        return Ticket.byId(this.ticketId).fetch()
            .then(function(_ticket) {
                ticket = _ticket;
                return ticket.removeTag("footag", self.user);
            })
            .then(function() {
                return ticket.tags().fetch();
            })
            .then(function(tags) {
                var tag = tags.findWhere({ tag: "footag" });
                assert(!tag);
            });
    });

    it("can be readded when the previous one is soft deleted", function() {
        var self = this;
        var ticket;
        return Ticket.byId(this.ticketId).fetch()
            .then(function(_ticket) {
                ticket = _ticket;
                return ticket.addTag("footag", self.user);
            })
            .then(function() {
                return ticket.tags().fetch();
            })
            .then(function(tags) {
                assert(tags.findWhere({ tag: "footag" }));
            });

    });

    it("can be added as ticket status", function() {
        var self = this;
        var ticket;
        return Ticket.byId(this.ticketId).fetch()
            .then(function(_ticket) {
                ticket = _ticket;
                return ticket.setStatus("inprogress", self.user);
            })
            .then(function() {
                return ticket.tags().fetch();
            })
            .then(function(tags) {
                var status = tags.findWhere({ tag: "status:inprogress" });
                assert(status, "has 'status:inprogress' tag");
                assert.equal(
                    status.getStatus(),
                    "inprogress",
                    "can get the plain status using #getStatus()"
                );

            });
    });

    it("soft deletes previous status tag when adding new status", function() {
        var self = this;
        var ticket;
        return Ticket.byId(this.ticketId).fetch()
            .then(function(_ticket) {
                ticket = _ticket;
                return ticket.setStatus("done", self.user);
            })
            .then(function() {
                return ticket.tags().fetch();
            })
            .then(function(tags) {
                assert(
                    tags.findWhere({ tag: "status:done" }),
                    "has 'status:done' tag"
                );

                var prevStatus = tags.findWhere({ tag: "status:inprogress" });
                assert(!prevStatus, "prev status is not present");

                var otherTag = tags.findWhere({ tag: "othertag" });
                assert(otherTag, "othertag is available");
                assert(!otherTag.get("deleted_at"), "othertag is not soft deleted");
            });
    });



});

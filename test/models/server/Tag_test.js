"use strict";
var Promise = require("bluebird");
var assert = require("assert");

var helpers = require("app/test/helpers");
var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");

describe("Tag model", function() {

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
                    "A title",
                    "This ticket has some tags",
                    self.user
                );
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
                    tag.get("createdById"),
                    "has correct creator"
                );

            });
    });

    it("cannot have multiple instances of the same tag", function() {
        var self = this;

        return Ticket.byId(this.ticketId).fetch()
        .then(function(ticket) {
            return ticket.addTag("footag", self.user).return(ticket);
        })
        .then(function(ticket) {
            return ticket.load("tags");
        })
        .then(function(ticket) {
            assert.equal(
                1,
                ticket.relations.tags.where({ tag: "footag" }).length
            );
        });
    });

    it("other tickets can have the same tag", function() {
        var self = this;
        return Ticket.create(
                "A other ticket title",
                "This ticket also has some tags",
                self.user
            ).then(function(ticket) {
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
                assert(tag.get("deletedAt"));
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
        return Ticket.byId(this.ticketId).fetch()
            .then(function(ticket) {
                return ticket.setStatus("inprogress", self.user)
                    .then(function() { return ticket; });
            })
            .then(function(ticket) {
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
                assert(prevStatus.get("deletedAt"), "prev status is not present");

                var otherTag = tags.findWhere({ tag: "othertag" });
                assert(otherTag, "othertag is available");
                assert(!otherTag.get("deletedAt"), "othertag is not soft deleted");
            });
    });



});

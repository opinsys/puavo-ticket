"use strict";

var Promise = require("bluebird");

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
                        creator_user_id: self.user.get("id"),
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
                return ticket.fetchUpdates();
            })
            .then(function(updates) {

                var tags = updates.filter(function(update) {
                    return update.get("type") === "tags";
                })
                .filter(function(update) {
                    return update.get("tag") === "footag";
                });

                assert.equal(1, tags.length, "has footag");

                var tag = tags[0];
                assert.equal(
                    self.user.get("id"),
                    tag.get("creator_user_id"),
                    "has correct creator"
                );

            });
    });

    it("cannot have multiple instances of the same tag", function() {
        var self = this;
        var catchExecuted = false;

        return Ticket.byId(this.ticketId).fetch()
            .then(function(ticket) {
                return ticket.addTag("footag", self.user);
            })
            .catch(function(err) {
                catchExecuted = true;
                assert.equal("tag already exists", err.message);
            })
            .then(function() {
                assert(catchExecuted, "catch was not executed");
            });
    });

    it("other tickets can have the same tag", function() {
        var self = this;
        return Ticket.forge({
                creator_user_id: self.user.get("id"),
                title: "Other tag test ticket",
                description: "This ticket also has some tags"
            })
            .save()
            .then(function(ticket) {
                return ticket.addTag("footag", self.user);
            });
    });


    it("can be readded when the previous one is soft deleted", function() {
        var self = this;
        var ticket;
        return Ticket.byId(this.ticketId).fetch()
            .then(function(_ticket) {
                ticket = _ticket;
                return _ticket.fetchUpdates();
            })
            .then(function(updates) {
                return new Promise(function(resolve, reject){
                    updates.forEach(function(update) {
                        if (update.get("type") !== "tags") return;
                        if (update.get("tag") !== "footag") return;
                        resolve(update.softDelete());
                    });
                });
            })
            .then(function() {
                return ticket.addTag("footag", self.user);
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
                return ticket.fetchUpdates();
            })
            .then(function(updates) {
                assert(
                    updates.findWhere({ tag: "status:inprogress" }),
                    "has 'status:inprogress' tag"
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
                return ticket.fetchUpdates();
            })
            .then(function(updates) {
                assert(
                    updates.findWhere({ tag: "status:done" }),
                    "has 'status:done' tag"
                );

                var prevStatus = updates.findWhere({ tag: "status:inprogress" });

                assert(prevStatus, "previous status is present");
                assert(prevStatus.get("deleted_at"), "previous is soft deleted");

                var otherTag = updates.findWhere({ tag: "othertag" });
                assert(otherTag, "othertag is available");
                assert(!otherTag.get("deleted_at"), "othertag is not soft deleted");
            });
    });


});

/*global it, describe, before */

var setupTestDatabase = require("../setupTestDatabase");

var Ticket = require("../../models/server/Ticket");
var assert = require("assert");


describe("Ticket model", function() {

    before(function() {
        return setupTestDatabase();
    });

    it("Instance can be created", function() {
        var title = "Computer does not work :(";

        return Ticket.forge({
            title: title,
            description: "It just doesn't"
        })
        .save()
        .then(function(ticket) {
            return Ticket.forge({ id: ticket.get("id") }).fetch();
        })
        .then(function(ticket) {
             assert.equal(title, ticket.get("title"));
        });

    });

    it("can have comments", function() {
        var ticketId = Ticket.forge({
            title: "computer does not work",
            description: "It just doesn't"
        })
        .save()
        .then(function(ticket) {
            return ticket.addComment({
                comment: "foo"
            })
            .then(function() {
                return ticket.get("id");
            });
        });

        return ticketId.then(function(id) {
            return Ticket.forge({ id: id })
                .fetch({ withRelated: "comments" })
                .then(function(ticket) {
                    assert.equal(
                        ticket.related("comments").length,
                        1,
                        "should have one comment"
                    );

                    var comment = ticket.related("comments").models[0];

                    assert.equal(comment.get("comment"), "foo");
                });
        });

    });

    it("can be edited", function() {
        var id;
        return Ticket.collection().fetch()
            .then(function(coll) {
                var ticket = coll.first();
                id = ticket.get("id");
                ticket.set("title", "new title");
                return ticket.save();
            })
            .then(function() {
                return Ticket.forge({ id: id }).fetch();
            })
            .then(function(ticket) {
                assert.equal(ticket.get("title"), "new title");
            });
    });

});


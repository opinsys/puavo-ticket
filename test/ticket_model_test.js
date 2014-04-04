/*global it, describe */

var Ticket = require("../models/Ticket");
var assert = require("./assert");

describe("Ticket model", function() {
    it("Instance can be created", function() {
        var title = "Computer does not work :(";

        var savedTicket = Ticket.forge({
            title: title,
            description: "It just doesn't"
        })
        .save()
        .then(function(ticket) {
            return Ticket.forge({ id: ticket.get("id") }).fetch();
        })
        .then(function(ticket) {
            return ticket.get("title");
        })
        ;

        return assert.becomes(savedTicket, title);

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

});


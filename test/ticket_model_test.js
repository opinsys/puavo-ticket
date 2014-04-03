/*global it, describe, before, beforeEach, after, afterEach */

var Promise = require("bluebird");
var DB = require("../db");
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
});


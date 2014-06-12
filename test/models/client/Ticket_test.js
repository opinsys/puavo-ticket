"use strict";

var Ticket = require("../../../models/client/Ticket");
var assert = require("assert");


describe("Ticket model", function() {

    it("can be instantiated", function() {
        var title = "Computer does not work :(";

        var ticket = new Ticket({
            title: title,
            description: "It just doesn't",
            readTickets: [ { ticket_id: 487,
                              readBy: 323,
                              id: 60,
                              readAt: '2014-06-10T08:04:55.249Z',
                              unread: null,
                              unique_id: 'readTickets:60',
                              type: 'readTickets' } ]
        });

        assert.equal(ticket.get("title"), "Computer does not work :(");
        assert.equal(ticket.hasRead(323), true);

    });

});


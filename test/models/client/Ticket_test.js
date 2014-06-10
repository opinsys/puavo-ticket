"use strict";

var Ticket = require("../../../models/client/Ticket");
var assert = require("assert");


describe("Ticket model", function() {

    it("can be instantiated", function() {
        var title = "Computer does not work :(";

        var ticket = new Ticket({
            title: title,
            description: "It just doesn't",
            read_tickets: [ { ticket_id: 487,
                              read_by: 323,
                              id: 60,
                              read_at: '2014-06-10T08:04:55.249Z',
                              updates: null,
                              unique_id: 'read_tickets:60',
                              type: 'read_tickets' } ]
        });

        assert.equal(ticket.get("title"), "Computer does not work :(");
        assert.equal(ticket.hasRead(323), true);

    });

});


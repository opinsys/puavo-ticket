
var Base = require("./Base");

var Ticket = Base.extend({
    urlRoot: "/api/tickets",


    defaults: function() {
        return {
            title: "",
            description: ""
        };
    }

}, {

    collection: function() {
        return (new TicketCollection());
    }

});


var TicketCollection = Base.Collection.extend({
    url: "/api/tickets",
    model: Ticket
});

module.exports = Ticket;


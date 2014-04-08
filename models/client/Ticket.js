
var Base = require("./Base");

var Ticket = Base.extend({
    urlRoot: "/api/tickets",

    defaults: function() {
        return {
            title: "",
            description: ""
        };
    }

});

module.exports = Ticket;


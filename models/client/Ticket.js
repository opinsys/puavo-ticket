"use strict";
var Base = require("./Base");

/**
 * Client ticket model
 *
 * @namespace models.client
 * @class Ticket
 * @extends models.client.Base
 * @uses models.TicketMixin
 */
var Ticket = Base.extend({
    urlRoot: "/api/tickets",

    defaults: function() {
        return {
            title: "",
            description: ""
        };
    },


    /**
     * Some method
     *
     * @method foo
     */
    foo: function() {
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


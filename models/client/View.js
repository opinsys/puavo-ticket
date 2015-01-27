"use strict";

var Base = require("./Base");
var Ticket = require("./Ticket");
var fetch = require("../../utils/fetch");

/**
 * Client View model
 *
 * @namespace models.client
 * @class View
 * @extends models.client.Base
 * @uses models.TicketMixin
 * @uses models.client.UpdateMixin
 */
var View = Base.extend({

    collectionURL: "/api/views",

    url: function() {
        if (this.get("id")) {
            return "/api/views/" + this.get("id");
        }
        return "/api/views";
    },

    /**
     * @method tickets
     * @return {models.client.Ticket.Collection}
     */
    tickets: function() {
        return Ticket.collection([], {
            query: Object.assign({limit: 99}, this.get("query"))
        });
    },

    /**
     * @method fetchCount
     * @return {Bluebird.Promise} with number of tickets in the view
     */
    fetchCount: function() {
        var tickets = this.tickets();
        var url = tickets.formatURL({ return: "count" });
        return fetch({ method: "get", url })
        .then(function(res) {
            return res.data.count;
        });
    },

    defaults: function() {
        return {
            createdAt: new Date().toString(),
        };
    },


});

module.exports = View;

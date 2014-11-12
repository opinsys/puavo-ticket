"use strict";

var Base = require("./Base");

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


    defaults: function() {
        return {
            createdAt: new Date().toString(),
        };
    },


});

module.exports = View;

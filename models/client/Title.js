"use strict";
var Base = require("./Base");

/**
 * Client Title model
 *
 * @namespace models.client
 * @class Title
 * @extends models.client.Base
 * @uses models.TicketMixin
 */
var Title = Base.extend({

    defaults: function() {
        return {
            type: "titles",
            createdAt: new Date().toString()
        };
    },

    url: function() {
        return this.parent.url() + "/titles";
    },

});

module.exports = Title;

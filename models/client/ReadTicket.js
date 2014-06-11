"use strict";

var Cocktail = require("backbone.cocktail");

var Base = require("./Base");

/**
 * Client ReadTicket model
 *
 * @namespace models.client
 * @class ReadTicket
 * @extends models.client.Base
 * @uses models.TagMixin
 */
var ReadTicket = Base.extend({

    defaults: function() {
        return {
            type: "read_tickets"
        };
    },

    url: function() {
        return this.parent.url() + "/read";
    }

});

Cocktail.mixin(ReadTicket);
module.exports = ReadTicket;

"use strict";

var Cocktail = require("backbone.cocktail");

var Base = require("./Base");

/**
 * Client Notification model
 *
 * @namespace models.client
 * @class Notification
 * @extends models.client.Base
 * @uses models.TagMixin
 */
var Notification = Base.extend({

    defaults: function() {
        return {
            type: "readTickets"
        };
    },

    url: function() {
        return this.parent.url() + "/read";
    }

});

Cocktail.mixin(Notification);
module.exports = Notification;

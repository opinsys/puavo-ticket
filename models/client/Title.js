"use strict";
var _ = require("lodash");

var Base = require("./Base");
var UpdateMixin = require("./UpdateMixin");

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

_.extend(Title.prototype, UpdateMixin);
module.exports = Title;

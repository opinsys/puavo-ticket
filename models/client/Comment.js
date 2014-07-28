"use strict";
var Base = require("./Base");

/**
 * Client Comment model
 *
 * @namespace models.client
 * @class Comment
 * @extends models.client.Base
 * @uses models.TicketMixin
 */
var Comment = Base.extend({

    defaults: function() {
        return {
            type: "comments",
            createdAt: new Date().toString()
        };
    },

    url: function() {
        return this.parent.url() + "/comments";
    },

});

module.exports = Comment;

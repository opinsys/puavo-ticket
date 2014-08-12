"use strict";
var _ = require("lodash");

var Base = require("./Base");
var UpdateMixin = require("./UpdateMixin");

/**
 * Client Comment model
 *
 * @namespace models.client
 * @class Comment
 * @extends models.client.Base
 * @uses models.TicketMixin
 * @uses models.client.UpdateMixin
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

_.extend(Comment.prototype, UpdateMixin);

module.exports = Comment;

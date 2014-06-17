"use strict";
var Base = require("./Base");
var User = require("./User");


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
            created_at: new Date().toString()
        };
    },

    url: function() {
        return this.parent.url() + "/comments";
    },


    createdBy: function() {
        return new User(this.get("createdBy"));
    }


});

module.exports = Comment;

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


    /**
     * Merge two comments to new one
     *
     * @method merge
     * @param {models.client.Comment} another
     * @return {models.client.Comment}
     */
    merge: function(another){
        if (this.get("createdById") !== another.get("createdById")) {
            throw new Error("Can merge comments only from the same creator");
        }

        var data = this.toJSON();
        data.comment = data.comment.trim() + "\n" + another.get("comment").trim();
        data.createdAt = another.get("createdAt");
        return new Comment(data, { parent: this.parent });
    }

});

_.extend(Comment.prototype, UpdateMixin);

module.exports = Comment;

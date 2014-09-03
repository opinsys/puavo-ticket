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
            createdAt: new Date().toString(),
            merged: []
        };
    },

    url: function() {
        return this.parent.url() + "/comments";
    },

    mergedComments: function() {
        var self = this;
        return this.get("merged").map(function(data) {
            return new Comment(data, { parent: self.parent });
        });
    },

    /**
     * @method ticket
     * @return {models.client.Ticket}
     */
    ticket: function() {
        var Ticket = require("./Ticket");
        return new Ticket(this.rel("ticket"));
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
        data.merged = data.merged.concat(another.toJSON());

        // Use the last timestamp for the whole merged comment
        data.createdAt = another.get("createdAt");
        return new Comment(data, { parent: this.parent });
    }

});

_.extend(Comment.prototype, UpdateMixin);

module.exports = Comment;

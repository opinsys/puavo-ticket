"use strict";
var Promise = require("bluebird");
var _ = require("lodash");
var marked = require("marked");

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

    _htmlCache: null,

    defaults: function() {
        return {
            type: "comments",
            createdAt: new Date().toString(),
            comment: "",
            merged: []
        };
    },

    url: function() {
        return this.parent.url() + "/comments";
    },

    /**
     * Convert comment string to a HTML string assuming it is a Markdown string
     *
     * @method toHTML
     * @return {String}
     */
    toHTML: function(){
        // Because our client side models are immutable we can safely cache
        // this per model forever. i.e. the comment string will never change
        // during the lifetime of this model.
        if (this._htmlCache) return this._htmlCache;
        this._htmlCache = toMd(this.get("comment"));
        return this._htmlCache;
    },

    /**
     * Return comments that are merged to this comment using Comment#merge(...)
     *
     * @method getMergedComments
     * @return {Array} of models.client.Comment
     */
    getMergedComments: function() {
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

/**
 * Convert Markdown string to HTML
 *
 * @static
 * @method toMd
 * @param {String} s
 * @return {String}
 */
function toMd(s) {
    // Configure options here
    // https://github.com/chjj/marked
    return marked(s);
}

_.extend(Comment.prototype, UpdateMixin);

module.exports = Comment;

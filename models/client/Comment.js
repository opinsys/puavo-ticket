"use strict";
var Base = require("./Base");


function commentUrl(ticketId) {
    return "/api/tickets/" + ticketId + "/comments";
}

/**
 * Client Comment model
 *
 * @namespace models.client
 * @class Comment
 * @extends models.client.Base
 * @uses models.TicketMixin
 */
var Comment = Base.extend({

    url: function() {
        return commentUrl(this.collection.ticketId);
    }

}, {

    /**
     *
     * Return empty collection of comments
     *
     * @method collection
     * @static
     * @param {Object} options
     * @param {String} option.ticketId Id of the ticket which owns the comments
     * @return {models.client.Comment.Collection}
     */
    collection: function(opts) {
        return new Collection(null, opts);
    },


});

/**
 *
 * Client-side collection if ticket comments
 *
 * @namespace models.client.Comment
 * @class Collection
 * @extends models.client.Base.Collection
 */
var Collection = Base.Collection.extend({

    /**
     * http://backbonejs.org/#Collection-model
     *
     * @property model
     * @type {models.client.Comment}
     */
    model: Comment,

    initialize: function(models, opts) {
        if (opts && opts.ticketId) this.ticketId = opts.ticketId;
    },

    url: function() {
        if (!this.ticketId) {
            throw new Error("Cannot fetch comments without ticketId!");
        }
        return commentUrl(this.ticketId);
    }

});

module.exports = Comment;

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
        return commentUrl(this.collection.opts.id);
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
        return new Comment.Collection(null, opts);
    },

    /**
     *
     * Client-side collection if ticket comments
     *
     * @namespace models.client.Comment
     * @class Collection
     * @extends models.client.Base.Collection
     */
    Collection: Base.Collection.extend({

        /**
         * @property model
         * @type {models.client.Comment}
         */
        model: Comment,

        initialize: function(models, opts) {
            this.opts = opts;
        },

        url: function() {
            return commentUrl(this.opts.id);
        }

    })

});

module.exports = Comment;
"use strict";
var Base = require("./Base");
var _ = require("lodash");
var Comment = require("./Comment");

/**
 * Client ticket model
 *
 * @namespace models.client
 * @class Ticket
 * @extends models.client.Base
 * @uses models.TicketMixin
 */
var Ticket = Base.extend({
    urlRoot: "/api/tickets",

    defaults: function() {
        return {
            title: "",
            description: ""
        };
    },

    /**
     * Return comments for the Ticket. Calls are cached. Ie. multiple calls to
     * this method will return the same collection instance.
     *
     * @method comments
     * @return {models.client.Comment.Collection} Collection of comments wrapped in a Promise
     */
    comments: function(){
        if (!this.get("id")) {
            throw new Error("Cannot get comments for unsaved ticket!");
        }
        if (this._comments) return this._comments;
        this._comments = Comment.collection({ id: this.get("id") });
        var self = this;
        this._comments.on("all", function(eventName) {
            self.trigger.apply(self, arguments);
        }, this);
        return this._comments;
    },

    /**
     * Resets the model attributes back to defaults.  Comment collection cache
     * is also cleard.
     *
     * @method reset
     */
    reset: function() {
        if (this._comments) {
            this._comments.off(null, null, this);
            this._comments = null;
        }
        this.clear();
        this.set(_.result(this.defaults));
    },

}, {


    /**
     * Return empty collection of tickets
     *
     * @method collection
     * @static
     * @return {models.client.Ticket.Collection}
     */
    collection: function() {
        return new Ticket.Collection();
    },

    /**
     *
     * Client-side collection if tickets
     *
     * @namespace models.client.Ticket
     * @class Collection
     * @extends models.client.Base.Collection
     */
    Collection: Base.Collection.extend({
        url: "/api/tickets",

        /**
         * @property model
         * @type {models.client.Ticket}
         */
        model: Ticket
    })

});


module.exports = Ticket;


"use strict";
var Base = require("./Base");
var _ = require("lodash");
var UpdatesCollection = require("./UpdatesCollection");

/**
 * Client ticket model
 *
 * @namespace models.client
 * @class Ticket
 * @extends models.client.Base
 * @uses models.TicketMixin
 */
var Ticket = Base.extend({

    url: function() {
        if (this.get("id")) {
            return "/api/tickets/" + this.get("id");
        }
        return "/api/tickets";
    },

    defaults: function() {
        return {
            title: "",
            description: ""
        };
    },

    initialize: function() {
        this.on("change:id", this._setTicketIdForUpdates.bind(this));
    },

    _setTicketIdForUpdates: function() {
        this.updates().ticketId = this.get("id");
    },

    /**
     * Return updates for the Ticket. Calls are cached. Ie. multiple calls to
     * this method will return the same collection instance.
     *
     * @method updates
     * @return {models.client.UpdatesCollection} Collection of comments wrapped in a Promise
     */
    updates: function(){
        if (this._updates) return this._updates;
        this._updates = new UpdatesCollection();
        var self = this;
        this._updates.on("all", function(eventName) {
            self.trigger.apply(self, arguments);
        }, this);
        this._setTicketIdForUpdates();
        return this._updates;
    },

    /**
     * Resets the model attributes back to defaults.  Comment collection cache
     * is also cleared.
     *
     * @method reset
     */
    reset: function() {
        if (this._updates) {
            this._updates.off(null, null, this);
            this._updates = null;
        }
        this.clear();
        this.set(_.result(this, "defaults"));
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
        return new Collection();
    },

});

/**
 *
 * Client-side collection if tickets
 *
 * @namespace models.client.Ticket
 * @class Collection
 * @extends models.client.Base.Collection
 */
var Collection = Base.Collection.extend({

    url: function() {
        return "/api/tickets";
    },

    /**
     * http://backbonejs.org/#Collection-model
     *
     * @property model
     * @type {models.client.Ticket}
     */
    model: Ticket
});

module.exports = Ticket;


"use strict";
var Base = require("./Base");
var Tag = require("./Tag");
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
     * @method addTag
     * @param {String} tagName
     * @return {Bluebird.Promise}
     */
    addTag: function(tagName) {
        var tag = new Tag({ tag: tagName });
        this.updates().add(tag);
        return tag.save();
    },

    /**
     * Close ticket by adding `status:closed` tag to it
     *
     * @method setClosed
     * @return {Bluebird.Promise}
     */
    setClosed: function() {
        return this.addTag("status:closed");
    },

    /**
     * (re)open ticket by adding `status:open` tag to it
     *
     * @method setOpen
     * @return {Bluebird.Promise}
     */
    setOpen: function() {
        return this.addTag("status:open");
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

    /**
     * Get ticket status using the updates relation. Ticket updates must be
     * fetched with `this.updates().fetch() for this to work.
     *
     * @method getCurrentStatus
     * @return {String}
     */
    getCurrentStatus: function() {
        var statusTags = this.updates().filter(function(update) {
            return _.result(update, "isStatusTag");
        });

        if (statusTags.length === 0) {
            return null;
        }

        return _.max(statusTags,  function(update) {
            return update.createdAt().getTime();
        }).getStatus();
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


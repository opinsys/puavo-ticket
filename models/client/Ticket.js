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


    dispose: function() {
        this.off();
        if (this._updates) {
            this._updates.off();
            this._updates.invoke("off");
            this._updates.reset();
            this._updates = null;
        }
    },

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
        this._updates = new UpdatesCollection();
        this._updates.setTicket(this);
        Base.prototype.initialize.call(this);
    },

    /**
     * Fetch ticket content and its updates
     *
     * @method fetchAll
     * @return {Bluebird.Promise}
     */
    fetchAll: function() {
        if (!this.get("id")) throw new Error("Cannot fetch without an id");
        this.fetch();
        this.updates().fetch();
    },

    /**
     * Return updates for the Ticket. Calls are cached. Ie. multiple calls to
     * this method will return the same collection instance.
     *
     * @method updates
     * @return {models.client.UpdatesCollection} Collection of comments wrapped in a Promise
     */
    updates: function(){
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
     * @method tags
     * @return {models.client.Base.Collection} Collection of models.client.Tag models
     */
    tags: function() {
        return Tag.collection(this.get("tags"));
    },

    /**
     * Get ticket status using the updates relation. Ticket updates must be
     * fetched with `this.updates().fetch() for this to work.
     *
     * @method getCurrentStatus
     * @return {String}
     */
    getCurrentStatus: function() {
        var statusTags = this.tags().filter(function(tag) {
            return tag.isStatusTag();
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


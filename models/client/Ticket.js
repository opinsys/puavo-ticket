"use strict";
var debug = require("debug")("puavo-ticket:models/client/Ticket");
var Base = require("./Base");
var Tag = require("./Tag");
var Handler = require("./Handler");
var Comment = require("./Comment");
var Tag = require("./Tag");
var ReadTicket = require("./ReadTicket");
var _ = require("lodash");

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
            description: "",
            tags: [],
            tagHistory: [],
            comments: [],
            handlers: [],
            createdAt: new Date().toString()
        };
    },

    /**
     * Return updates for the Ticket. Calls are cached. Ie. multiple calls to
     * this method will return the same collection instance.
     *
     * @method updates
     * @return {models.client.UpdatesCollection} Collection of comments wrapped in a Promise
     */
    updates: function(){
        var updates =  this.tags()
        .concat(this.tagHistory())
        .concat(this.handlers())
        .concat(this.comments())
        ;
        updates.sort(function(a, b) {
            if (a.get("createdAt") > b.get("createdAt")) return 1;
            if (a.get("createdAt") < b.get("createdAt")) return -1;
            return 0;
        });

        return updates;
    },

    tags: function() {
        var self = this;
        return this.get("tags").map(function(data) {
            return new Tag(data, { parent: self });
        });
    },

    /**
     * Returns true after Ticket#fetch() has loaded ticket data
     *
     * @method hasData
     * @return {Boolean}
     */
    hasData: function() {
        return !!this.get("title");
    },

    tagHistory: function() {
        var self = this;
        return this.get("tagHistory").map(function(data) {
            return new Tag(data, { parent: self });
        });
    },

    comments: function() {
        var self = this;
        return this.get("comments").map(function(data) {
            return new Comment(data, { parent: self });
        });
    },

    /**
     * TODO
     *
     * @method addComment
     * @param {String} comment
     * @param {models.client.User} createdBy
     * @return {Bluebird.Promise}
     */
    addComment: function(comment, createdBy){
        var model = new Comment({
            comment: comment,
            createdBy: createdBy.toJSON()
        }, { parent: this });
        return model.save();
    },


    /**
     * @method addTag
     * @param {String} tagName
     * @param {models.client.User} createdBy
     * @return {Bluebird.Promise}
     */
    addTag: function(tagName, createdBy) {
        var model = new Tag({
            tag: tagName,
            createdBy: createdBy.toJSON()
        }, { parent: this });
        return model.save();
    },

    /**
     * Add handler for the ticket
     *
     * @method addHandler
     * @param {models.client.User} handler
     */
    addHandler: function(user){
        var h = new Handler({
            username: user.getUsername(),
            organisation_domain: user.getOrganisationDomain()
        }, { parent: this });
        return h.save();
    },

    /**
     * Close ticket by adding `status:closed` tag to it
     *
     * @method setClosed
     * @param {models.client.User} createdBy
     * @return {Bluebird.Promise}
     */
    setClosed: function(createdBy) {
        return this.addTag("status:closed", createdBy);
    },

    /**
     * (re)open ticket by adding `status:open` tag to it
     *
     * @method setOpen
     * @param {models.client.User} createdBy
     * @return {Bluebird.Promise}
     */
    setOpen: function(createdBy) {
        return this.addTag("status:open", createdBy);
    },

    /**
     * Resets the model attributes back to defaults.  Comment collection cache
     * is also cleared.
     *
     * @method reset
     */
    reset: function() {
        this.clear();
        this.set(_.result(this, "defaults"));
    },


    /**
     *
     * @method handlers
     * @return {models.client.Base.Collection} Collection of models.client.Handler models
     */
    handlers: function() {
        var self = this;
        return this.get("handlers").map(function(data) {
            return new Handler(data, { parent: self });
        });
    },


    /**
     * @method isHandler
     * @param {models.client.User|Number}
     * @return {Boolean}
     */
    isHandler: function(user) {
        return this.handlers().some(function(handler) {
            return handler.getHandlerUser().isSame(user);
        });
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

    /**
     * Get read status of ticket
     *
     * @method hasRead
     * @param {Integer} userId
     * @return {Boolean}
     */
    hasRead: function(userId) {
        return this.get("readTickets").some( function(readTicket) {
            return readTicket.readById === userId && readTicket.unread === false;
        });
    },

    /**
     * @method markAsRead
     * @param {Integer} userId
     * @return {Bluebird.Promise}
     */
    markAsRead: function() {
        debug("Mark ticket as read: " + this.get("title"));
        var model = new ReadTicket({}, { parent: this });
        return model.save({ dummy: 1 });
    }


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


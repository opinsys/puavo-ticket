"use strict";
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
            created_at: new Date().toString()
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
            if (a.get("created_at") > b.get("created_at")) return 1;
            if (a.get("created_at") < b.get("created_at")) return -1;
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

        this.push("comments", model.toJSON());

        return model.save().bind(this).then(function() {
            this.fetch();
        });

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
        this.push("tags", model.toJSON());
        return model.save().then(this.fetch.bind(this, null));
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
        return this.get("read_tickets").some( function(read_ticket) {
            return read_ticket.read_by === userId;
        });
    },

    /**
     * @method markAsRead
     * @param {Integer} userId
     * @return {Bluebird.Promise}
     */
    markAsRead: function() {
        console.log("Mark ticket as read: " + this.get("title"));
        var model = new ReadTicket({}, { parent: this });
        return model.save();
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


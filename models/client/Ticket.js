"use strict";
var debug = require("debug")("puavo-ticket:models/client/Ticket");
var Promise = require("bluebird");
var _ = require("lodash");

var app = require("app");
var Base = require("./Base");
var Tag = require("./Tag");
var Handler = require("./Handler");
var Follower = require("./Follower");
var Comment = require("./Comment");
var User = require("./User");
var Title = require("./Title");
var Tag = require("./Tag");
var Notification = require("./Notification");

function byCreation(a, b) {
    if (a.createdAt().getTime() > b.createdAt().getTime()) return 1;
    if (a.createdAt().getTime() < b.createdAt().getTime()) return -1;
    return 0;
}

/**
 * Mock user for Opinsys robot
 *
 * @private
 * @static
 * @class TicketView.opinsysRobot
 */
var opinsysRobot = new User({
    id: -1,
    externalData: {
        id: "-1",
        email: "tuki@opinsys.fi",
        first_name: "Opinsys",
        last_name: "Oy",
        organisation_name: "Automaatti"
    }
});

opinsysRobot.robot = true;
opinsysRobot.getProfileImage = function() {
    return "/images/support_person.png";
};

opinsysRobot.getDomainUsername = function() {
    return "tuki@opinsys.fi";
};

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
            titles: [],
            comments: [],
            handlers: [],
            followers: [],
            createdAt: new Date().toString()
        };
    },


    /**
     * Create comment which is created by a "robot". Used to insert the automatic welcome message
     *
     * @method createRobotComment
     * @param {String} id Unique comment id
     * @return {models.client.Comment}
     */
    createRobotComment: function(text, id) {
        // Second after the ticket creation
        var afterTicketCreation = new Date(this.createdAt().getTime() + 2000).toString();

        var comment = new Comment({
            createdAt: afterTicketCreation,
            comment: text,
            attachments: [],
            id: id
        }, { parent: this });

        comment.createdBy = function() {
            return opinsysRobot;
        };

        return comment;
    },

    /**
     * Return array of all organisation domains that are related to this ticket
     *
     * @method getRelatedOrganisationDomains
     * @return {Array}
     */
    getRelatedOrganisationDomains: function(){
        var domains = {};

        domains[this.createdBy().getOrganisationDomain()] = true;
        domains[app.currentUser.getOrganisationDomain()] = true;

        this.comments().forEach(function(comment) {
            domains[comment.createdBy().getOrganisationDomain()] = true;
        });
        this.handlers().forEach(function(handler) {
            domains[handler.createdBy().getOrganisationDomain()] = true;
            domains[handler.getUser().getOrganisationDomain()] = true;
        });

        return _.uniq(
            Object.keys(domains).concat(this.getTaggedOrganisationDomains())
        );
    },

    /**
     * @method getTaggedOrganisationDomains
     * @return {Array}
     */
    getTaggedOrganisationDomains: function(){
        return this.tags().map(function(tag) {
            var m = /^organisation\:(.+)$/.exec(tag.get("tag"));
            return m && m[1];
        }).filter(Boolean);
    },

    /**
     * Return updates for the Ticket. Calls are cached. Ie. multiple calls to
     * this method will return the same collection instance.
     *
     * @method updates
     * @return {models.client.UpdatesCollection} Collection of comments wrapped in a Promise
     */
    updates: function(){
        var welcome = this.createRobotComment(
            "Olemme vastaanottaneet tukipyyntösi. Voit vielä halutessasi täydentää sitä kommentoimalla tähän.",
            "welcome"
        );
        var updates = [welcome]
        .concat(this.tags().slice(1))
        .concat(this.handlers().slice(1))
        .concat(this.titles())
        .concat(this.comments())
        ;
        return updates.sort(byCreation);
    },

    /**
     * @method firstUnreadUpdateFor
     * @param {models.client.User} user
     * @return {models.client.Base}
     */
    firstUnreadUpdateFor: function(user) {
        return _.find(this.comments().sort(byCreation), function(comment) {
            return comment.isUnreadBy(user);
        });
    },

    /**
     * @method tags
     * @return {Array} Array of Tag models
     */
    tags: function() {
        var self = this;
        return this.get("tags").map(function(data) {
            return new Tag(data, { parent: self });
        }).sort(byCreation);
    },

    /**
     *
     * @method titles
     * @return {Array} Array of Title models
     */
    titles: function(){
        var self = this;
        var previousTitle = "";
        return this.get("titles").map(function(data) {
            var t =  new Title(_.extend(data, {
                previousTitle: previousTitle
            }), { parent: self });

            previousTitle = t.get("title");
            return t;
        }).sort(byCreation);
    },

    /**
     * Returns true after Ticket#fetch() has loaded ticket data
     *
     * @method hasData
     * @return {Boolean}
     */
    hasData: function() {
        return !!this.get("createdById");
    },

    comments: function() {
        var self = this;
        return this.rel("comments").map(function(data) {
            return new Comment(data, { parent: self });
        }).sort(byCreation);
    },

    /**
     *
     * @method addComment
     * @param {String} comment
     * @return {Bluebird.Promise}
     */
    addComment: function(comment){
        var model = new Comment({ comment: comment }, { parent: this });
        return model.save();
    },

    /**
     *
     * @method addTitle
     * @param {String} title
     * @return {Bluebird.Promise}
     */
    addTitle: function(title){
        var model = new Title({ title: title }, { parent: this });
        return model.save();
    },


    /**
     * @method addTag
     * @param {String} tagName
     * @return {Bluebird.Promise}
     */
    addTag: function(tagName) {
        var model = new Tag({
            tag: tagName
        }, { parent: this });
        return model.save();
    },

    /**
     * @method hasTag
     * @return {Boolen}
     */
    hasTag: function(tag){
        return this.tags().some(function(tagOb) {
            return !tagOb.isSoftDeleted() && tagOb.get("tag") === tag;
        });
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
        }).sort(byCreation);
    },


    /**
     * @method isHandler
     * @param {models.client.User|Number}
     * @return {Boolean}
     */
    isHandler: function(user) {
        return this.handlers().some(function(handler) {
            return handler.getUser().isSame(user);
        });
    },

    /**
     *
     * @method followers
     * @return {Array} of models.client.Followers
     */
    followers: function(){
        var self = this;
        return this.get("followers").filter(Boolean).map(function(data) {
            return new Follower(data, { parent: self });
        }).sort(byCreation);
    },


    /**
     * @method isFollower
     * @param {models.client.User|Number}
     * @return {Boolean}
     */
    isFollower: function(user) {
        return this.followers().some(function(follower) {
            return follower.getUser().isSame(user);
        });
    },

    /**
     * @method addFollower
     * @param {models.client.User|Number} user User or user id
     * @return {Bluebird.Promise}
     */
    addFollower: function(user){
        var model = new Follower({
            followedById: user.get("id")
        }, { parent: this });
        return model.save();
    },

    /**
     * @method removeFollower
     * @return {Bluebird.Promise}
     */
    removeFollower: function(user){
        return Promise.all(this.followers().filter(function(follower) {
            return follower.getUser().isSame(user);
        }).map(function(follower) {
            return follower.destroy();
        }));
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
            return tag.isStatusTag() && !tag.get("deletedAt");
        });

        if (statusTags.length === 0) {
            return null;
        }


        return _.max(statusTags,  function(update) {
            return update.createdAt().getTime();
        }).getStatus();
    },

    /**
     * @method getCurrentTitle
     * @return {String}
     */
    getCurrentTitle: function(){
        var titles = this.titles();
        if (titles.length === 0) return null;

        return _.max(titles,  function(m) {
            return m.createdAt().getTime();
        }).get("title");
    },

    /**
     * Get read status of ticket
     *
     * @method hasRead
     * @param {Integer} userId
     * @return {Boolean}
     */
    hasRead: function(userId) {
        return this.get("notifications").some(function(notification) {
            return notification.targetId === userId && notification.unread === false;
        });
    },

    /**
     * Get Date object when the given user has last read this ticket content
     *
     * @method getReadDate
     * @param {models.client.User} user
     * @return {Date}
     */
    getReadAtFor: function(user){
        var never = new Date(0);
        var reads = this.get("notifications");
        if (!reads || reads.length === 0) return never;
        return _(reads)
            .filter(Boolean)
            .filter(function(ob) {
                return ob.targetId === user.get("id");
            }).map(function(ob) {
                return new Date(ob.readAt);
            }).max(function(readAt) {
                return readAt.getTime();
            }).value();
    },


    /**
     * @method markAsRead
     * @param {Integer} userId
     * @return {Bluebird.Promise}
     */
    markAsRead: function() {
        debug("Mark ticket as read: " + this.get("title"));
        var model = new Notification({}, { parent: this });
        return model.save({ dummy: 1 })
            .bind(this)
            .then(function() {
                Ticket.trigger("markedAsRead", this);
            });
    },


}, {


    /**
     * Return empty collection of tickets
     *
     * @static
     * @method collection
     * @param {Object} [options]
     * @return {models.client.Ticket.Collection}
     */
    collection: function(options) {
        return new Collection(options.models, options);
    }

});

/**
 *
 * Client-side collection if tickets
 *
 * @namespace models.client
 * @class Ticket.Collection
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
    model: Ticket,

    /**
     * Select tickets that are closed
     *
     * @method selectClosed
     * @return {Array} of models.client.Ticket
     */
    selectClosed: function() {
        return this.filter(function(t) {
            return t.getCurrentStatus() === "closed";
        });
    },

    /**
     * Select tickets that are open
     *
     * @method selectOpen
     * @return {Array} of models.client.Ticket
     */
    selectOpen: function() {
        return this.filter(function(t) {
            return t.getCurrentStatus() === "open";
        });
    },

    /**
     * Select tickets that have no manager handler
     *
     * @method selectPending
     * @return {Array} of models.client.Ticket
     */
    selectPending: function() {
        return this.selectOpen().filter(function(t) {
            // None of the handlers are manager
            return !t.handlers().some(function(h) {
                return h.getUser().isManager();
            });
        });
    },

    /**
     * Select tickets that handled by the given user
     *
     * @method selectHandledBy
     * @param {models.client.User} user
     * @return {Array} of models.client.Ticket
     */
    selectHandledBy: function(user) {
        return this.selectOpen().filter(function(t) {
            // One of the handlers is me
            return t.handlers().some(function(h) {
                return h.getUser().get("id") === user.get("id");
            });
        });
    },

    /**
     * Select tickets that handled by other managers than the given one
     *
     * @method selectHandledByOtherManagers
     * @param {models.client.User} user
     * @return {Array} of models.client.Ticket
     */
    selectHandledByOtherManagers: function(user) {
        return this.selectOpen().filter(function(t) {

            var managers = t.handlers().map(function(h) {
                return h.getUser();
            }).filter(function(u) {
                return u.isManager();
            });

            // No manager handlers - the ticket is pending
            if (managers.length === 0) return false;

            // Every manager is not me
            return managers.every(function(manager) {
                return manager.get("id") !== user.get("id");
            });

        });
    },

});

module.exports = Ticket;


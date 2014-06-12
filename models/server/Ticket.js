"use strict";
var _ = require("lodash");
var Promise = require("bluebird");

var Base = require("./Base");
var Comment = require("./Comment");
var Tag = require("./Tag");
var RelatedUser = require("./RelatedUser");
var Visibility = require("./Visibility");
var Attachment = require("./Attachment");
var Follower = require("./Follower");
var Handler = require("./Handler");
var Device = require("./Device");
var User = require("./User");
var ReadTicket = require("./ReadTicket");


/**
 * Knex query helpers
 *
 * @namespace models.server
 * @private
 * @class Ticket.queries
 */
var queries = {

    /**
     * Get updates that are not soft deleted
     *
     * Example:
     *
     *      ticket.tags().query(queries.notSoftDeleted).fetch();
     *
     * @method notSoftDeleted
     */
    notSoftDeleted: function(qb) {
        qb.where("deleted", "=",  "0");
    },

    softDeleted: function(qb) {
        qb.where("deleted", "!=",  "0");
    }


};


/**
 * Server Ticket model
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class Ticket
 */
var Ticket = Base.extend({
    tableName: "tickets",

    defaults: function() {
        return {
            created_at: new Date(),
            updated_at: new Date()
        };
    },

    initialize: function(attrs, options) {
        this.on("created", this._setInitialTicketState.bind(this));
        this.on("update", this.markAsUnread, this);

    },

    _setInitialTicketState: function (ticket) {
        return ticket.createdBy().fetch().then(function(user) {
            var isOpen = ticket.setStatus("open", user);
            var hasNoHandlersTag = ticket.addTag("nohandlers", user);
            var creatorCanView = ticket.addVisibility(
                user.getPersonalVisibility(),
                user
            );
            var organisationAdminCanView = ticket.addVisibility(
                user.getOrganisationAdminVisibility(),
                user
            );

            return Promise.all([
                isOpen,
                creatorCanView,
                hasNoHandlersTag,
                organisationAdminCanView
            ]);
        });
    },

    /**
     *
     * @method comments
     * @return {Bookshelf.Collection} Bookshelf.Collection of Ticket comment models
     */
    comments: function() {
        return this.hasMany(Comment, "ticket_id");
    },


    /**
     * @method visibilities
     * @return {models.server.Visibility}
     */
    visibilities: function() {
        return this.hasMany(Visibility, "ticket_id");
    },

    readTickets: function() {
        return this.hasMany(ReadTicket, "ticket_id");
    },

    /**
     * Add visibility to the ticket. If the visibility already exists for the
     * ticket the existing visibility is returned.
     *
     * Visibility strings can be accessed for example from User#getVisibilities()
     *
     * @method addVisibility
     * @param {String} visibility Visibility string
     * @param {models.server.User|Number} addedBy User model or id of user who adds the visibility
     * @param {String} [comment] Optional comment for the visibility
     * @return {Bluebird.Promise} with models.server.Visibility
     */
    addVisibility: function(visibility, addedBy, comment) {
        var self = this;
        if (typeof visibility !== "string" || !visibility) {
            throw new Error("visibility must be a string");
        }

        return Visibility.forge({
                ticket_id: self.get("id"),
                entity: visibility,
            }).fetch()
            .then(function(existingVisibility) {
                if (existingVisibility) return existingVisibility;
                return Visibility.forge({
                    ticket_id: self.get("id"),
                    entity: visibility,
                    comment: comment,
                    created_by: Base.toId(addedBy)
                }).save();
            });
    },

    /**
     * Add comment to the ticket
     *
     * @method addComment
     * @param {String} comment
     * @param {models.server.User|Number} user Creator of the tag
     * @return {Bluebird.Promise} with models.server.Comment
     */
    addComment: function(comment, user) {
        var self = this;

        return Comment.forge({
            ticket_id: this.get("id"),
            comment: comment,
            created_by: Base.toId(user)
        }).save()
        .then(function(comment) {
            return self.triggerThen("update", { model: comment })
                .then(function() { return comment; });
        });
    },

    /**
     * Add Tag to the ticket
     *
     * @method addTag
     * @param {String} tag
     * @param {models.server.User} user Creator of the tag
     * @return {Bluebird.Promise} with models.server.Tag
     */
    addTag: function(tag, user) {
        return Tag.forge({
            tag: tag,
            created_by: Base.toId(user),
            ticket_id: this.get("id")
        }).save();
    },

    /**
     * Soft delete given tag
     *
     * @method removeTag
     * @param {String} tag
     * @param {models.server.User|Number} removedBy
     * @param {Object} [options]
     * @param {Boolean} [options.require=false] When true the promise is
     * rejected if the tag is missing
     * @return {Bluebird.Promise}
     */
    removeTag: function(tag, removedBy, options){
        var self = this;
        return Tag.collection()
            .query(queries.notSoftDeleted)
            .query(function(qb) {
                qb.where({
                    tag: tag,
                    ticket_id: self.get("id"),
                });
            })
            .fetch()
            .then(function(tags) {
                if (options && options.require && tags.size() === 0) {
                    throw new Error("Cannot find tag '" + tag + "'");
                }
                return tags.invokeThen("softDelete", removedBy);
            });
    },

    /**
     * Get all tags for this ticket
     *
     * @method tags
     * @return {Bookshelf.Collection} Bookshelf.Collection of tag models
     */
    tags: function(){
        return this.hasMany(Tag, "ticket_id").query(queries.notSoftDeleted);
    },

    tagHistory: function() {
        return this.hasMany(Tag, "ticket_id").query(queries.softDeleted);
    },

    /**
     * Set status of the ticket
     *
     * @method setStatus
     * @param {String} status
     * @param {models.server.User} user Creator of the status
     * @return {Bluebird.Promise} models.server.Tag representing the status
     */
    setStatus: function(status, user){
        return this.addTag("status:" + status, user);
    },

    /**
     * Return collection containing only one models.server.Tag representing the
     * status of the ticket. When serialized as JSON this field will appear as
     * a simple string field. Example: `status: "open"`.
     *
     * @method status
     * @return {Bookshelf.Collection}
     */
    status: function() {
        return this.tags()
            .query(queries.notSoftDeleted)
            .query(function(qb) {
                qb.where("tag", "LIKE", "status:%");
            });
    },


    /**
     * Get all attachments to this ticket
     *
     * @method attachments
     * @return {Bookshelf.Collection} Bookshelf.Collection of Attachment models
     */
    attachments: function() {
        return this.hasMany(Attachment, "ticket_id").query(queries.notSoftDeleted);
    },

    /**
     * Add follower to the ticket
     *
     * @method addFollower
     * @param {Object} follower Plain object with models.server.Follower fields
     * @return {Bluebird.Promise} with models.server.Follower
     */
    addFollower: function(follower) {
        follower = _.clone(follower);
        follower.ticket_id = this.get("id");
        return Follower.forge(follower).save();
    },

    /**
     * Add handler to a ticket
     *
     * @method addHandler
     * @param {models.server.User|Number} handler User model or id of handler
     * @param {models.server.User|Number} addedBy User model or id of user who adds the handler
     * @return {Bluebird.Promise} with models.server.Handler
     */
    addHandler: function(handler, addedBy) {
        var self = this;

        if (Base.isModel(handler)) handler = Promise.cast(handler);
        else handler = User.byId(handler).fetch({ require: true });

        return handler.then(function(handler) {
            return Promise.all([

                Handler.forge({
                    ticket_id: self.get("id"),
                    created_by: Base.toId(addedBy),
                    handler: Base.toId(handler)
                }).save(),

                self.addVisibility(
                    handler.getPersonalVisibility(),
                    addedBy
                ),

                self.removeTag("nohandlers", addedBy)

            ]);
        })
        .spread(function(handler, visibility) {
            return handler;
        });

    },

    /**
     *
     * @method handlers
     * @return {Bookshelf.Collection} Bookshelf.Collection of Ticket handlers
     */
    handlers: function() {
        return this.hasMany(Handler, "ticket_id");
    },

    handlerUsers: function() {
        return this.belongsToMany(User, "handlers", "ticket_id", "handler");
    },

    /**
     * @method isHandler
     * @param {models.server.User|Number}
     * @return {Bluebird.Promise} with Boolean
     */
    isHandler: function(user){
        return this.handlerUsers()
            .query(function(qb) {
                qb.where({ "users.id": user.get("id") });
            })
            .fetch()
            .then(function(users) {
                return !!users.findWhere({ id: user.get("id") });
            });
    },

    /**
     * Add device relation
     *
     * @method addDevice
     * @param {models.server.Device|Number} device Device model or external id of the device
     * @param {models.server.User|Number} addedBy User model or id of user who adds the device
     * @return {Bluebird.Promise} with models.server.Device
     */
    addDevice: function(device, addedBy){
        return Device.forge({
                ticket_id: this.get("id"),
                created_by: Base.toId(addedBy),
                hostname: Base.toAttr(device, "hostname")
            })
            .save();
    },

    /**
     *
     * @method devices
     * @return {Bookshelf.Collection} Bookshelf.Collection of Ticket devices
     */
    devices: function() {
        return this.hasMany(Device, "ticket_id");
    },

    /**
     * Add related user to the ticket
     *
     * @method addRelatedUser
     * @param {models.server.User|Number} user User object or id for the relation
     * @param {models.server.User|Number} addedBy User model or id of user who adds the user
     * @return {Bluebird.Promise} with models.server.RelatedUser
     */
    addRelatedUser: function(user, addedBy){
        return RelatedUser.forge({
            ticket_id: this.get("id"),
            created_by: Base.toId(addedBy),
            user: Base.toId(user)
        }).save();
    },

    /**
     *
     * @method relatedUsers
     * @return {Bookshelf.Collection} Bookshelf.Collection of Ticket related users
     */
    relatedUsers: function() {
        return this.hasMany(RelatedUser, "ticket_id");
    },

    createdBy: function() {
        return this.belongsTo(User, "created_by");
    },

    /**
     * Mark ticket as read
     *
     * @method markAsRead
     * @param {models.server.User|Number} user User model or id of user
     * @return {Bluebird.Promise} with models.server.ReadTicket
     */
    markAsRead: function(user) {
        var self = this;

        console.log("Mark ticket as read: " + this.get("title"));

        return ReadTicket.forge({
            ticket_id: self.get("id"),
            readById: Base.toId(user)
        })
        .fetch()
        .then(function(readTicket) {
            console.log(readTicket);
            if(readTicket) {
                readTicket.set({
                    readAt: new Date(),
                    unread: false });
                return readTicket.save();
            }

            return ReadTicket.forge({
                ticket_id: self.get("id"),
                readById: Base.toId(user),
                readAt: new Date(),
                unread: false
            }).save();
        });
    },

    /**
     * Mark ticket as unread
     *
     * @method markAsUnread
     * @param {models.server.Attachment|Comment|Device|Follower|Handler|RelatedUsers|Tag}
     * @return {Bluebird.Promise} with models.server.ReadTicket
     */
    markAsUnread: function(model) {
        var self = this;
        console.log("Mark ticket as unread: " + self.get("title"));
        console.log(model);

        return ReadTicket.collection()
            .query("where", "ticket_id", "=", self.get("id"))
            .fetch()
            .then(function(readTickets) {
                return Promise.all(
                    readTickets.mapThen(function(readTicket) {
                        return readTicket.set(
                            { "readAt": new Date(),
                              "unread": "true" }
                            )
                            .save();
                    })
                );
            });
    }

});

/**
 * Fetch tickets by give visibilities.
 *
 * @static
 * @method byVisibilities
 * @param {Array} visibilities Array of visibility strings. Strings are in the
 * form of `organisation|school|user:<entity id>`.
 *
 *     Example: "school:2"
 * @return {models.server.Base.Collection} with models.server.Ticket models
 */
Ticket.byVisibilities = function(visibilities) {
    return Ticket
        .collection()
        .query(function(queryBuilder) {
            queryBuilder
            .join("visibilities", "tickets.id", "=", "visibilities.ticket_id")
            .whereIn("visibilities.entity", visibilities)
            .whereNull("visibilities.deleted_at");
        });
};

module.exports = Ticket;

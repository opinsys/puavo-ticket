"use strict";
var _ = require("lodash");
var Promise = require("bluebird");
var Bookshelf = require("bookshelf");

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

    initialize: function() {
        this.on("created", function setInitialTicketState(ticket) {
            return ticket.createdBy().fetch().then(function(user) {
                var isOpen = ticket.setStatus("open", user);
                var creatorCanView = ticket.addVisibility(
                    user.getPersonalVisibility(),
                    user
                );

                return Promise.all([isOpen, creatorCanView]);
            });
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

    /**
     * Add visibility to the ticket.
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
     * @param {Object} comment Plain object with models.server.Comment fields
     * @return {Bluebird.Promise} with models.server.Comment
     */
    addComment: function(comment) {
        comment = _.clone(comment);
        comment.ticket_id = this.get("id");
        return Comment.forge(comment).save();
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
        return Tag.collection().query(function(qb) {
                qb.where({
                    tag: tag,
                    ticket_id: self.get("id"),
                    deleted: 0
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
     * @method tags
     */
    tags: function(){
        return this.hasMany(Tag, "ticket_id");
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
            .query(function(qb) {
                qb
                .whereNull("deleted_at")
                .andWhere("tag", "LIKE", "status:%");
            });
    },

    toJSON: function() {
        var json = Base.prototype.toJSON.call(this);

        if (this.related("status").models.length) {
            json.status = this.related("status").models[0].getStatus();
        }

        return json;
    },


    /**
     * Get all attachments to this ticket
     *
     * @method attachments
     * @return {Bookshelf.Collection} Bookshelf.Collection of Attachment models
     */
    attachments: function() {
        return this.hasMany(Attachment, "ticket_id");
    },

    /**
     * Add follower to the ticket
     *
     * @method addFollower
     * @param {Object} comment Plain object with models.server.Follower fields
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

                // TODO: handle unique constraint errors
                self.addVisibility(
                    handler.getPersonalVisibility(),
                    addedBy
                )

            ])
            .spread(function(handler, visibility) {
                return handler;
            });
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
     * Get all updates related to this ticket
     *
     * @method fetchUpdates
     * @return {Bluebird.Promise} with Bookshelf Collection of Comment|Device|RelatedUser models
     * wrapped in a promise
     */
    fetchUpdates: function() {
        var self = this;

        var updatePromises = [
            "comments",
            "devices",
            "tags",
        ].map(function(method) {
            return self[method]().fetch({
                withRelated: "createdBy"
            });
        });

        updatePromises.push(this.handlers().fetch({
            withRelated: ["createdBy", "handler"]
        }));

        updatePromises.push(this.relatedUsers().fetch({
            withRelated: ["createdBy", "user"]
        }));

        return Promise.all(updatePromises)
            .then(function(updates) {

                updates = _.flatten(updates.map(function(coll) {
                    // Convert to array so the resulting array of arrays can be
                    // flattened to a flat array
                    return coll.toArray();
                }));

                updates.sort(function(a,b) {
                    if ( a.get("updated_at") > b.get("updated_at") ) {
                        return 1;
                    }
                    if ( a.get("updated_at") < b.get("updated_at") ) {
                        return -1;
                    }

                    return 0;

                });

                // convert back to Bookshelf Collection
                return new Bookshelf.DB.Collection(updates);
            });

    },

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
 * @return {Bluebird.Promise} with Backbone.Collection of models.server.Ticket
 */
Ticket.byVisibilities = function(visibilities) {
    return Ticket
        .collection()
        .query(function(queryBuilder) {
            queryBuilder
            .join("visibilities", "tickets.id", "=", "visibilities.ticket_id")
            .whereIn("visibilities.entity", visibilities);
        });
};

module.exports = Ticket;

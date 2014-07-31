"use strict";
var fs = require("fs");
var _ = require("lodash");
var Promise = require("bluebird");

var config = require("../../config");
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
var Title = require("./Title");


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
            createdAt: new Date(),
            updatedAt: new Date()
        };
    },

    /**
     * nodemailer email transport object
     *
     * https://github.com/andris9/Nodemailer
     *
     * @private
     * @property _mailTransport
     * @type Object
     */
    _mailTransport: config.mailTransport,

    /**
     *
     * @method initialize
     * @param attrs Model attributes
     * @param [options.mailTransport] custom mail transport
     */
    initialize: function(attrs, options) {
        if (options && options.mailTransport) {
            this._mailTransport = options.mailTransport;

        }

        /**
         * See nodemailer module docs
         *
         * @private
         * @method _sendMailPromise
         * @param {Object} options
         * @return {Bluebird.Promise}
         * */
        this._sendMailPromise = Promise.promisify(
            this._mailTransport.sendMail.bind(this._mailTransport)
        );

        this.on("created", this._setInitialTicketState.bind(this));
        this.on("update", this.onTicketUpdate.bind(this));

    },

    _setInitialTicketState: function (ticket) {
        return ticket.createdBy().fetch().then(function(user) {
            var isOpen = ticket.setStatus("open", user, {
                force: true
            });
            var hasNoHandlersTag = ticket.addTag("nohandlers", user);
            var creatorCanView = ticket.addHandler(
                user,
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
        return this.hasMany(Comment, "ticketId");
    },

    /**
     *
     * @method titles
     * @return {Bookshelf.Collection} Bookshelf.Collection of Ticket title models
     */
    titles: function() {
        return this.hasMany(Title, "ticketId");
    },

    /**
     * @method visibilities
     * @return {models.server.Visibility}
     */
    visibilities: function() {
        return this.hasMany(Visibility, "ticketId");
    },

    readTickets: function() {
        return this.hasMany(ReadTicket, "ticketId");
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
                ticketId: self.get("id"),
                entity: visibility,
            }).fetch()
            .then(function(existingVisibility) {
                if (existingVisibility) return existingVisibility;
                return Visibility.forge({
                    ticketId: self.get("id"),
                    entity: visibility,
                    comment: comment,
                    createdById: Base.toId(addedBy)
                }).save();
            });
    },

    /**
     * Add comment to the ticket
     *
     * @method addComment
     * @param {String} comment
     * @param {models.server.User|Number} user Creator of the tag
     * @param {Boolean} opts.silent Set to true to disable update notifications
     * @return {Bluebird.Promise} with models.server.Comment
     */
    addComment: function(comment, user, opts) {
        return Comment.forge({
            ticketId: this.get("id"),
            comment: comment,
            createdById: Base.toId(user)
        }).save()
        .then(triggerUpdate(opts, this));
    },


    /**
     * Add title to the ticket
     *
     * @method addTitle
     * @param {String} title
     * @param {models.server.User|Number} user Creator of the tag
     * @param {Boolean} opts.silent Set to true to disable update notifications
     * @return {Bluebird.Promise} with models.server.Title
     */
    addTitle: function(title, user, opts) {
        return Title.forge({
            ticketId: this.get("id"),
            title: title,
            createdById: Base.toId(user)
        }).save()
        .then(triggerUpdate(opts, this));
    },

    /**
     * Add Tag to the ticket
     *
     * @method addTag
     * @param {String} tag
     * @param {models.server.User} user Creator of the tag
     * @return {Bluebird.Promise} with models.server.Tag
     */
    addTag: function(tag, user, options) {
        return Tag.forge({
            tag: tag,
            createdById: Base.toId(user),
            ticketId: this.get("id")
        }, options).save();
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
                    ticketId: self.get("id"),
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
        return this.hasMany(Tag, "ticketId").query(queries.notSoftDeleted);
    },

    tagHistory: function() {
        return this.hasMany(Tag, "ticketId").query(queries.softDeleted);
    },

    /**
     * Set status of the ticket
     *
     * @method setStatus
     * @param {String} status
     * @param {models.server.User} user Creator of the status
     * @param {Boolean} [options.force=false] Set to true to skip manager validation
     * @return {Bluebird.Promise} models.server.Tag representing the status
     */
    setStatus: function(status, user, options){
        return this.addTag("status:" + status, user, options);
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
        return this.hasMany(Attachment, "ticketId").query(queries.notSoftDeleted);
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
        follower.ticketId = this.get("id");
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
                    ticketId: self.get("id"),
                    createdById: Base.toId(addedBy),
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
        return this.hasMany(Handler, "ticketId");
    },

    handlerUsers: function() {
        return this.belongsToMany(User, "handlers", "ticketId", "handler");
    },

    /**
     * Returns true if the user is handler for this ticket
     *
     * 'handlerUsers' relation must be loaded with 'withRelated' in fetch or
     * with Ticket#load("handlerUsers")
     *
     * @method isHandler
     * @param {models.server.User|Number}
     * @return {Boolean}
     */
    isHandler: function(user){
        if (!this.relations.handlerUsers) {
            throw new Error("'handlerUsers' relation not loaded");
        }

        return this.relations.handlerUsers.some(function(handlerUser) {
            return handlerUser.get("id") === Base.toId(user);
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
                ticketId: this.get("id"),
                createdById: Base.toId(addedBy),
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
        return this.hasMany(Device, "ticketId");
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
            ticketId: this.get("id"),
            createdById: Base.toId(addedBy),
            user: Base.toId(user)
        }).save();
    },

    /**
     *
     * @method relatedUsers
     * @return {Bookshelf.Collection} Bookshelf.Collection of Ticket related users
     */
    relatedUsers: function() {
        return this.hasMany(RelatedUser, "ticketId");
    },

    createdBy: function() {
        return this.belongsTo(User, "createdById");
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

        return ReadTicket.forge({
            ticketId: self.get("id"),
            readById: Base.toId(user)
        })
        .fetch()
        .then(function(readTicket) {
            if(readTicket) {
                readTicket.set({
                    readAt: new Date(),
                    unread: false });
                return readTicket.save();
            }

            return ReadTicket.forge({
                ticketId: self.get("id"),
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

        return ReadTicket.collection()
            .query("where", "ticketId", "=", self.get("id"))
            .fetch()
            .then(function(coll) { return coll.models; })
            .map(function(readTicket) {
                return readTicket.set({
                    readAt: new Date(),
                    unread: "true"
                }).save();
            });
    },

    /**
     * Return the current title. Requires `titles` relation
     *
     * @method getCurrentTitle
     * @return {String}
     */
    getCurrentTitle: function() {
        if (!this.relations.titles) {
            throw new Error("titles relation not fetched. Use load or withRelated");
        }

        var titles = this.relations.titles.models;
        if (titles.length === 0) {
            throw new Error("Invalid Ticket model. No title!");
        }

        return _.max(titles, function(m) {
            return m.createdAt().getTime();
        }).get("title");
    },

    sendMail: function(updateModel){
        var self = this;

        return self.load(["titles", "handlers.handler"]).then(function() {
            return updateModel.load("createdBy");
        }).then(function() {
            return self.relations.handlers.models;
        }).map(function(handler){
            return handler.related("handler").getEmail();
        })
        .map(function(email) {
            return self._sendMailPromise({
                from: "Opinsys support <noreply@opinsys.net>",
                to: email,
                subject: "Tiketti " + self.get("id") + ": " + self.getCurrentTitle(),
                text: renderUpdateEmail({
                    title: self.getCurrentTitle(),
                    ticketId: self.get("id"),
                    name: updateModel.relations.createdBy.getFullname(),
                    url: "https://support.opinsys.fi/tickets/" + self.get("id")
                })
            });
        });
    },

    onTicketUpdate: function(e){
        return Promise.all([
            this.markAsUnread(e.model),
            this.sendMail(e.model),
        ]);
    }

});

/**
 * Trigger update for the promise value
 *
 * @private
 * @static
 * @method triggerUpdate
 * @param {Boolean} opts.silent Set to true to disable the notification
 * @param {Object} context Se the context of the returned function
 * @return {Function}
 */
function triggerUpdate(opts, context) {
    return function(updateModel) {
        if (opts && opts.silent) return updateModel;

        return this.triggerThen("update", {
            model: updateModel
        }).return(updateModel);

    }.bind(context);
}

/**
 * Render email update template
 *
 * @private
 * @static
 * @method renderUpdateEmail
 * @param {Object} context
 * @return {String}
 */
var renderUpdateEmail = _.template(
    fs.readFileSync(__dirname + "/email_update_template.txt").toString()
);

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
            .join("visibilities", "tickets.id", "=", "visibilities.ticketId")
            .whereIn("visibilities.entity", visibilities)
            .whereNull("visibilities.deletedAt");
        });
};

module.exports = Ticket;

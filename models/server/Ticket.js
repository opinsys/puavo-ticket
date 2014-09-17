"use strict";
var fs = require("fs");
var _ = require("lodash");
var Promise = require("bluebird");
var nodemailer = require("nodemailer");
var stubTransport = require("nodemailer-stub-transport");
var smtpTransport = require("nodemailer-smtp-transport");
var debugMail = require("debug")("puavo-ticket:mail");

var config = require("../../config");
var Base = require("./Base");
var Comment = require("./Comment");
var Tag = require("./Tag");
var RelatedUser = require("./RelatedUser");
var Visibility = require("./Visibility");
var Follower = require("./Follower");
var Handler = require("./Handler");
var Device = require("./Device");
var User = require("./User");
var Notification = require("./Notification");
var Title = require("./Title");
var Moment = require("moment");


if (config.smtp) {
    var mailTransport = nodemailer.createTransport( smtpTransport(config.smtp));
} else {
    console.warn("'smtp' config is missing from config. Email sending is disabled.");
    var mailTransport = nodemailer.createTransport(stubTransport());
}

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
    _mailTransport: mailTransport,

    /**
     *
     * @method initialize
     * @param attrs Model attributes
     * @param [options.mailTransport] custom mail transport
     */
    initialize: function(attrs, options) {
        // tests can override the mail transport
        if (options && options.mailTransport) {
            this._mailTransport = options.mailTransport;
        }

        /**
         * See nodemailer module docs
         *
         * @method sendMail
         * @param {Object} options
         * @return {Bluebird.Promise}
         * */
        this.sendMail = Promise.promisify(
            this._mailTransport.sendMail.bind(this._mailTransport)
        );

        this.on("created", this._setInitialTicketState.bind(this));
        this.on("update", this.onTicketUpdate.bind(this));

    },

    _setInitialTicketState: function (ticket) {
        return ticket.createdBy().fetch().then(function(user) {
            return Promise.join(
                ticket.setStatus("open", user, { force: true }),
                ticket.addHandler(user, user),
                ticket.addVisibility(user.getOrganisationAdminVisibility(), user)
            );
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
     * Get unread comments for given user. Use `options.byEmail` to get those
     * comments that have not been sent out as email.
     *
     * @method unreadComments
     * @param {models.server.User|Number} user or user id
     * @param {options} [options]
     * @param {options} [options.byEmail] get comments that are not emailed
     * @return {Bookshelf.Collection}
     */
    unreadComments: function(user, options){
        var attr = "readAt";
        if (options && options.byEmail) {
            attr = "emailSentAt";
        }

        return this.comments().query(function(q) {
            q.join("notifications", function() {
                this.on("notifications.ticketId", "=", "comments.ticketId");
                this.on("notifications." + attr, "<", "comments.createdAt");
            });
            q.where({ "notifications.targetId": Base.toId(user) });
        });
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

    notifications: function() {
        return this.hasMany(Notification, "ticketId");
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
            throw new Error("visibility must be a non empty string");
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
     * @method triggerUpdate
     * @param {models.server.Base} model Any ticket relation model
     * @return {Bluebird.Promise}
     */
    triggerUpdate: function(model) {
        return this.triggerThen("update", {
            model: model
        }).return(model);
    },


    /**
     * Add comment to the ticket
     *
     * @method addComment
     * @param {String} comment
     * @param {models.server.User|Number} user Creator of the tag
     * @param {Boolean} [opts]
     * @param {Boolean} [opts.silent=false] Set to true to disable update notifications
     * @return {Bluebird.Promise} with models.server.Comment
     */
    addComment: function(comment, user, opts) {
        var self = this;
        return Promise.join(
            Comment.forge({
                ticketId: self.get("id"),
                comment: comment,
                createdById: Base.toId(user)
            }).save(),
            self.addFollower(user, user)
        ).then(function(comment) {
            return self.markAsRead(user).return(comment);
        })
        .spread(function(comment) {
            if (opts && opts.silent === false) return comment;
            return self.triggerUpdate(comment);
        });
    },

    /**
     * Add title to the ticket
     *
     * @method addTitle
     * @param {String} title
     * @param {models.server.User|Number} user Creator of the tag
     * @param {Boolean} [opts]
     * @param {Boolean} [opts.silent=false] Set to true to disable update notifications
     * @return {Bluebird.Promise} with models.server.Title
     */
    addTitle: function(title, user, opts) {
        return Title.forge({
            ticketId: this.get("id"),
            title: title,
            createdById: Base.toId(user)
        })
        .save()
        .bind(this)
        .then(function(title) {
            if (opts && opts.silent === false) return title;
            return this.triggerUpdate(title);
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
        return this.hasMany(Tag, "ticketId");
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
     * Add follower to a ticket. Also adds a visibility for the follower.
     *
     * @method addFollower
     * @param {models.server.User|Number} follower User model or id of the follower
     * @param {models.server.User|Number} addedBy User model or id of the user who adds the handler
     * @return {Bluebird.Promise} with models.server.Handler
     */
    addFollower: function(follower, addedBy) {
        var self = this;

        var followerOp = Follower.forge({
            ticketId: self.get("id"),
            followedById: Base.toId(follower)
        })
        .query(queries.notSoftDeleted)
        .fetch()
        .then(function(followerRelation) {
            if (followerRelation) return followerRelation;
            return Follower.forge({
                ticketId: self.get("id"),
                followedById: Base.toId(follower),
                createdById: Base.toId(addedBy)
            }).save();
        });


        return Promise.join(
            followerOp,
            self.addVisibility(follower.getPersonalVisibility(), addedBy),
            self.ensureNotification(follower)
        ).spread(function(followerRelation) {
            return followerRelation;
        });

    },

    /**
     * Ensure notification relation for a user
     *
     * @method ensureNotification
     * @param {models.server.User|Number} user
     * @return {Bluebird.Promise} with models.server.Notification
     */
    ensureNotification: function(user) {
        var self = this;

        return Notification.forge({
            ticketId: this.get("id"),
            targetId: Base.toId(user)
        })
        .fetch()
        .then(function(notification) {
            if (notification) return notification;

            // if relation does not exists create one with zero date i.e. the
            // user has never read the ticket. This makes this ticket visible
            // in notifications api.
            return Notification.forge({
                ticketId: self.get("id"),
                targetId: Base.toId(user),
                readAt: new Date(0),
                emailSentAt: new Date(0),
            }).save();
        });
    },

    /**
     * Add handler to a ticket
     *
     * @method addHandler
     * @param {models.server.User|Number} handler User model or id of the handler
     * @param {models.server.User|Number} addedBy User model or id of the user who adds the handler
     * @return {Bluebird.Promise} with models.server.Handler
     */
    addHandler: function(handler, addedBy) {
        var self = this;

        if (Base.isModel(handler)) handler = Promise.cast(handler);
        else handler = User.byId(handler).fetch({ require: true });

        return handler.then(function(handler) {
            return Promise.join(

                Handler.forge({
                    ticketId: self.get("id"),
                    createdById: Base.toId(addedBy),
                    handler: Base.toId(handler)
                }).save(),

                self.addFollower(handler, addedBy)
            );
        })
        .spread(function(handler) {
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

    /**
     * @method followers
     * @return {Bookshelf.Collection} Bookshelf.Collection of Ticket followers relations
     */
    followers: function(){
        return this.hasMany(Follower, "ticketId").query(queries.notSoftDeleted);
    },

    /**
     * Remove user from followers
     *
     * @method removeFollower
     * @param {models.server.User} user
     * @param {models.server.User} removedBy
     * @return {Bluebird.Promise}
     *
     */
    removeFollower: function(user, removedBy){
        return this.followers()
            .query(function(qb) {
                qb.where("followedById", "=", user.get("id"));
            })
            .fetch()
            .then(function(coll) {
                return coll.models;
            })
            .map(function(followerRelation) {
                return followerRelation.softDelete(removedBy);
            });
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
     * Get description ie. the first comment
     *
     * @method getDescription
     * @return {String}
     */
    getDescription: function() {
        if (!this.relations.comments) {
            throw new Error("'comments' relation not loaded");
        }

        if (this.relations.comments.length === 0) {
            throw new Error("No comments - no description!");
        }

        return _.min(this.relations.comments.models,  function(m) {
            return m.createdAt().getTime();
        }).get("comment");
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
     * @param {models.server.User|Number} user User model or id of the user
     * @return {Bluebird.Promise} with models.server.Notification
     */
    markAsRead: function(user, opts) {
        var self = this;
        return Notification.fetchOrCreate({
            ticketId: self.get("id"),
            targetId: Base.toId(user)
        })
        .then(function(notification) {
            return notification.set({
                readAt: new Date(),
                emailSentAt: new Date(),
            }).save();
        });
    },

    markAsUnread: function(model) {
        console.error("Deprecated call to Ticket#markAsUnread. Use Ticket#updateTimestamp()");
        return this.updateTimestamp();
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

    /**
     * Send email notifications about the updateModel to the handlers of this
     * ticket.
     *
     * @method sendMailUpdateNotification
     * @param {models.server.Base} updatedModel
     * @return {Bluebird.Promise}
     */
    sendMailUpdateNotification: function(updatedModel){
        var self = this;

        return Promise.join(
            self.load(["titles", "followers.follower"]),
            updatedModel.load("createdBy")
        ).then(function() {
            // XXX: This should not be required since we use the dot notation
            // above to load this relation too.
            // http://bookshelfjs.org/#Model-load
            return self.relations.followers.load("follower");
        }).then(function(followers) {
            return followers.models;
        }).map(function(follower) {
            return follower.related("follower");
        }).filter(function(user) {
            // Do not send update notifications to the update creator
            return user.get("id") !== updatedModel.get("createdById");
        })
        .map(function(user) {
            if (!user.getEmail()) {
                console.error(
                    "Warning! User",
                    user.getDomainUsername(),
                    "has no email address"
                 );
            }
            return user.getEmail();
        })
        .filter(Boolean)
        .map(function(email) {
            var title = self.getCurrentTitle();
            var id = self.get("id");

            debugMail(
                "Would send update email to %s about \"%s\" (%s)",
                email, title, id
            );

            return self.sendMail({
                from: "Opinsys tukipalvelu <noreply@opinsys.fi>",
                to: email,
                subject: "Tukipyyntö " + id + ": " + title,
                text: renderUpdateEmail({
                    title: self.getCurrentTitle(),
                    ticketId: self.get("id"),
                    name: updatedModel.relations.createdBy.getFullName(),
                    timestamp: Moment().format('D.M.YYYY H:mm'),
                    message: updatedModel.textToEmail(),
                    url: "https://support.opinsys.fi/tickets/" + self.get("id")
                })
            });
        });
    },


    /**
     * Update `updatedAt` column to current time. Should be called when ever a
     * update relation is added to the ticket
     *
     * @method updateTimestamp
     * @return {Bluebird.Promise}
     */
    updateTimestamp: function() {
        return this.set("updatedAt", new Date()).save();
    },

    onTicketUpdate: function(e){
        return Promise.join(
            this.updateTimestamp(),
            this.sendMailUpdateNotification(e.model)
        );
    },

    /**
     * @method getSocketIORoom
     * @return {String}
     */
    getSocketIORoom: function() {
        return "ticket:" + this.get("id");
    }

}, {

    /**
     * Shortcut for creating ticket with a title and description.
     *
     * @method create
     * @param {String} title
     * @param {String} description
     * @param {models.server.User|Number} createdBy
     * @param {Object} [options]
     * @param [options.mailTransport] custom mail transport
     * @return {Bluebird.Promise} with models.server.Ticket
     */
    create: function(title, description, createdBy, opts) {
        return this.forge({ createdById: Base.toId(createdBy) }, opts)
            .save()
            .then(function(ticket) {
                return Promise.join(
                    ticket.addTitle(title, createdBy),
                    ticket.addComment(description, createdBy)
                ).return(ticket);
            });
    },

    /**
     * Fetch tickets by given visibilities.
     *
     * @static
     * @method byVisibilities
     * @param {Array} visibilities Array of visibility strings. Strings are in the
     * form of `organisation|school|user:<entity id>`.
     *
     *     Example: "school:2"
     *
     * @return {models.server.Base.Collection} with models.server.Ticket models
     */
    byVisibilities: function(visibilities) {
        return this.collection()
            .query(function(queryBuilder) {
                queryBuilder
                .join("visibilities", "tickets.id", "=", "visibilities.ticketId")
                .whereIn("visibilities.entity", visibilities)
                .whereNull("visibilities.deletedAt");
            });
    },


    /**
     * Query tickets with visibilities of the user
     *
     * @static
     * @method
     * @param {models.server.User} user
     */
    byUserVisibilities: function(user) {
        // Manager is not restricted by visibilities. Just return everything.
        if (user.isManager()) return this.collection();
        else return this.byVisibilities(user.getVisibilities());
    },

    /**
     * Fetch the ticket by id with visibilities of the user
     *
     * @static
     * @method fetchByIdConstrained
     * @param {models.server.User} user
     * @param {Number} ticketId Ticket id
     * @param {Object} options Options passed to Bookshelf fetchOne method
     * @return {Bluebird.Promise} With models.server.Ticket
     */
    fetchByIdConstrained: function(user, ticketId, opts) {
        return this.byUserVisibilities(user).query({
            where: { "tickets.id": Base.toId(ticketId) }
        }).fetchOne(_.extend({ require: true }, opts));
    },

    /**
     * Return collection of tickets that have comments unread by the user
     *
     * @static
     * @method withUnreadComments
     * @param {models.client.User|Number} user
     * @param {Object} [options]
     * @param {Object} [options.byEmail=false] Get tickets by unsent email notifications
     * @return {Bookshelf.Collection} of models.server.Ticket
     */
    withUnreadComments: function(user, options) {
        var attr = "readAt";
        if (options && options.byEmail) {
            attr = "emailSentAt";
        }

        return this.byUserVisibilities(user)
            .query(function(qb) {
                qb
                .distinct()
                .join("followers", function() {
                    this.on("tickets.id", "=", "followers.ticketId");
                })
                .join("notifications", function() {
                    this.on("tickets.id", "=", "notifications.ticketId");
                })
                .join("comments", function() {
                    this.on("tickets.id", "=", "comments.ticketId");
                    this.on("notifications." + attr, "<", "comments.createdAt");
                })
                .whereNull("followers.deletedAt")
                .where({
                    "followers.deleted": 0,
                    "followers.followedById": Base.toId(user),
                    "notifications.targetId": Base.toId(user),
                });
            });
    },
});


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



module.exports = Ticket;

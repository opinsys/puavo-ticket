"use strict";
var fs = require("fs");
var _ = require("lodash");
var Promise = require("bluebird");
var crypto = require("crypto");
var winston = require("winston");

var config = require("../../config");
var Base = require("./Base");
var Comment = require("./Comment");
var Tag = require("./Tag");
var RelatedUser = require("./RelatedUser");
var Follower = require("./Follower");
var Handler = require("./Handler");
var Device = require("./Device");
var User = require("./User");
var Notification = require("./Notification");
var Title = require("./Title");
var TicketMixin = require("../TicketMixin");
var TicketCollection = require("./TicketCollection");

var debugEmail = require("debug")("app:email");


/**
 * Render buffered email update
 *
 * @private
 * @static
 * @method renderEmailBufferedTemplate
 * @param {Object} context
 * @return {String}
 */
var renderEmailBufferedTemplate = _.template(
    fs.readFileSync(__dirname + "/email_buffered_template.txt").toString()
);

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
        qb.where("deleted", "=", "0");
    },

    softDeleted: function(qb) {
        qb.where("deleted", "!=", "0");
    }


};



/**
 * Server Ticket model
 *
 * @namespace models.server
 * @extends models.server.Base
 * @uses models.TicketMixin
 * @class Ticket
 */
var Ticket = Base.extend(_.extend({}, TicketMixin, {
    tableName: "tickets",

    defaults: function() {
        return {
            createdAt: new Date(),
            updatedAt: new Date(),
            emailSecret: Ticket.generateSecret()
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
        var self = this;
        // tests can override the mail transport
        if (options && options.mailTransport) {
            this._mailTransport = options.mailTransport;
        }

        /**
         * See nodemailer module docs
         * https://github.com/andris9/Nodemailer#sending-mail
         *
         * @method sendMail
         * @param {Object} options
         * @return {Bluebird.Promise}
         * */
        this.sendMail = function(options) {
            return new Promise(function(resolve, reject){
                self._mailTransport.sendMail(options, function(err, res) {
                    if (err) return reject(err);
                    resolve(res);
                });
            });
        };

        this.on("created", this._setInitialTicketState.bind(this));
        this.on("update", this.onTicketUpdate.bind(this));

    },

    _setInitialTicketState: function (ticket) {
        return ticket.load(["createdBy", "comments"])
        .then(function(ticket) {
            var creator = ticket.relations.createdBy;
            return ticket.addHandler(creator, creator)
            .then(function() {
                var organisation = creator.getOrganisationDomain() || "unknown";

                var status = null;
                if (creator.isManager()) {
                    status = ticket.setStatus("open", creator);
                } else {
                    status = ticket.setStatus("pending", creator);
                }

                return Promise.join(
                    status,
                    ticket.addTag("organisation:" + organisation, creator)
                );
            });
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


    notifications: function() {
        return this.hasMany(Notification, "ticketId");
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
     * @param {Boolean} [opts.textType=plain] Set custom textType
     * @param {Boolean} [opts.hidden=false] Set comment as hidden
     * @return {Bluebird.Promise} with models.server.Comment
     */
    addComment: function(comment, user, opts) {
        winston.debug("adding comment", {
            ticketId: this.get("id"),
            comment: comment,
            addedById: Base.toId(user)
        });

        var self = this;
        return Promise.join(
            Comment.forge({
                ticketId: self.get("id"),
                comment: comment,
                createdById: Base.toId(user),
                hidden: !!(opts && opts.hidden),
                textType: (opts && opts.textType) || "plain"
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
        winston.debug("adding title", {
            ticketId: this.get("id"),
            title: title,
            addedById: Base.toId(user)
        });

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
     * @param {String|models.server.Tag} tag
     * @param {models.server.User} user Creator of the tag
     * @param {Object} [options]
     * @return {Bluebird.Promise} with models.server.Tag
     */
    addTag: function(tagName, user, opts) {
        if (Base.isModel(tagName)) tagName = tagName.get("tag");

        winston.debug("adding tag", {
            ticketId: this.get("id"),
            tag: tagName,
            addedById: Base.toId(user)
        });
        var self = this;

        return Tag.fetchOrCreate({
            tag: tagName,
            ticketId: this.get("id"),
            deleted: 0
        })
        .then(function(tag) {
            if (tag.isNew()) {
                tag.set({ createdById: Base.toId(user) });
                return tag.save();
            }
            return tag;
        })
        .then(function(tag) {
            if (opts && opts.silent === false) return tag;
            return self.triggerUpdate(tag);
        });

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
        winston.debug("removing tag", {
            ticketId: this.get("id"),
            tag: tag,
            removedById: Base.toId(removedBy)
        });
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
    addFollower(follower, addedBy) {
        winston.debug("adding follower", {
            ticketId: this.get("id"),
            handlerId: Base.toId(follower),
            addedById: Base.toId(addedBy)
        });
        return Follower.fetchOrCreate({
            ticketId: this.get("id"),
            followedById: Base.toId(follower),
            deleted: 0
        })
        .then((followerRel) => followerRel.ensureSaved(addedBy))
        .tap((followerRel) => Promise.join(
            this.ensureNotification(follower),
            this.addTag("user:" + follower.get("id"), addedBy)
        ));
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
    addHandler(user, addedBy) {
        winston.debug("adding handler", {
            ticketId: this.get("id"),
            handlerId: Base.toId(user),
            addedById: Base.toId(addedBy)
        });

        return Handler.fetchOrCreate({
            ticketId: this.get("id"),
            handler: Base.toId(user),
            deleted: 0
        })
        .then(handlerRel => handlerRel.ensureSaved(addedBy))
        .tap(() => this.load("tags"))
        .tap(handlerRel => {
            // Ensure fresh handler user object
            return handlerRel.handler().fetch({require: true})
            .tap(user => {
                // Set ticket from pending to open if a manager handler is added to it
                if (user.isManager() && this.getCurrentStatus() === "pending") {
                    return this.setStatus("open", addedBy);
                }
            })
            // Handlers always start following the ticket
            .tap(user => this.addFollower(user, addedBy));
        });

    },

    removeHandler(user, removedBy) {
        winston.debug("removing handler", {
            ticketId: this.get("id"),
            handlerId: Base.toId(user),
            removedById: Base.toId(removedBy)
        });
       return this.handlers()
       .query({ where: {
           handler: Base.toId(user),
           deleted: 0
       }})
       .fetchOne()
       .tap((handler) => Promise.join(
           handler.softDelete(removedBy),
           this.removeTag("handler:" + Base.toId(user), removedBy)
       ));
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
        winston.debug("removing follower", {
            ticketId: this.get("id"),
            followerId: Base.toId(user),
            removedById: Base.toId(removedBy)
        });
        return this.followers()
        .query((q) => q.where({followedById: user.get("id")}))
        .fetch()
        .then((c) => c.models)
        .map((followerRelation) => followerRelation.softDelete(removedBy))
        .tap(() => this.removeTag("follower:" + user.get("id"), removedBy));
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
     * @param {models.server.User}
     * @return {Boolean}
     */
    isHandler: function(user){
        return this.rel("handlerUsers").some(function(handlerUser) {
            return handlerUser.get("id") === user.get("id");
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

        return _.min(this.relations.comments.models, function(m) {
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
     * @param {Object} [options]
     * @param {Object} [options.emailOnly] Set to true to mark as read from email
     * @return {Bluebird.Promise} with models.server.Notification
     */
    markAsRead: function(user, options) {
        winston.debug("marking as read", {
            ticketId: this.get("id"),
            userId: Base.toId(user)
        });

        var self = this;
        return Notification.fetchOrCreate({
            ticketId: self.get("id"),
            targetId: Base.toId(user)
        })
        .then(function(notification) {
            var now = new Date();

            notification.set({ emailSentAt: now });

            if (!options || !options.emailOnly) {
                notification.set({ readAt: now });
            }

            return notification.save();
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

    /**
     * @method getReplyEmailAddress
     * @return {String}
     */
    getReplyEmailAddress: function() {
        return [
            "reply-to-", this.get("id"),
            "+", this.get("emailSecret"),
            "@", config.emailReplyDomain
        ].join("");
    },

    /**
     * Get url to this ticket
     *
     * @method getURL
     * @return {String}
     */
    getURL: function(){
        return "https://support.opinsys.fi/tickets/" + this.get("id");
    },

    /**
     * @method sendBufferedEmailNotifications
     * @param {models.server.User|Number} user User model or id of the user
     * @return {Bluebird.Promise}
     */
    sendBufferedEmailNotifications: function(user){
        var self = this;
        var id = this.get("id");
        var email = user.getEmail();
        var title = this.getCurrentTitle();
        var subject = "Tukipyyntö \"" + title + "\" (" + id + ") on päivittynyt";

        return this.unreadComments(user, { byEmail: true }).fetch({
            withRelated: ["createdBy"]
        })
        .then(function(collection) {

            var comments = collection.filter(function(comment) {
                return !comment.get("hidden");
            });

            if (comments.length === 0) return;

            var lastComment = _.max(comments, function(comment) {
                return comment.createdAt();
            });

            var age = Date.now() - lastComment.createdAt().getTime();

            if (age < 1000 * 60 * 5) {
                debugEmail(
                    "Ticket %s has comments added within last 5min. Skipping email send for %s",
                    id, user.getDomainUsername()
                );
                return;
            }

            comments = comments.map(function(comment) {
                return comment.toPlainText();
            }).join("\n----------------------------------------------\n");

            debugEmail(
                "Sending notification email about ticket %s for %s (%s)",
                id, user.getDomainUsername(), user.getEmail()
            );

            var from = "Opinsys tukipalvelu <"+ self.getReplyEmailAddress() +">";
            var emailData = {
                from: from,
                replyTo: from,
                to: email,
                subject: subject,
                text: renderEmailBufferedTemplate({
                    comments: comments,
                    url: self.getURL()
                })
            };
            winston.info("Sending email", {emailData});
            return self.sendMail(emailData)
            .then(function() {
                return self.markAsRead(user, { emailOnly: true });
            });
        });

    },

    /**
     * Send live updates to active users about the given comment
     *
     * @method sendLiveNotifications
     * @param {models.server.Comment} comment
     * @param {Object} sio Socket.IO object
     * @return {Bluebird.Promise}
     */
    sendLiveNotifications: function(comment, sio){
        var self = this;
        var userId = comment.get("createdById");

        sio.sockets.to(
            self.getSocketIORoom()
        ).emit("watcherUpdate", {
            ticketId: self.get("id"),
            commentId: comment.get("id")
        });

        return self.followers().query(function(q) {
            q.where("followedById", "!=", userId);
        })
        .fetch()
        .then(function(followers) {
            return comment.load([
                "createdBy",
                "ticket",
                "ticket.titles",
            ]).return(followers);
        })
        .then(function(followers) {
            return followers.models;
        })
        .each(function(follower) {
            sio.sockets.to(
                follower.getSocketIORoom()
            ).emit("followerUpdate", comment.toJSON());
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
        return this.updateTimestamp();
    },

    /**
     * @method getSocketIORoom
     * @return {String}
     */
    getSocketIORoom: function() {
        return "ticket:" + this.get("id");
    }

}), {

    collection: function(rows, options) {
        return new TicketCollection((rows || []), _.extend({}, options, {model: this}));
    },

    /**
     * Generate secure random secret for email replies
     *
     * @method generateSecret
     * @return {String}
     */
    generateSecret: function() {
        return crypto.randomBytes(10).toString("hex");
    },


    /**
     * Shortcut for creating ticket with a title and description.
     *
     * @method create
     * @param {String} title
     * @param {String} description
     * @param {models.server.User|Number} createdBy
     * @param {Object} [options]
     * @param [options.mailTransport] custom mail transport
     * @param {Boolean} [opts.textType=plain] Set custom textType for the
     * initial comment
     * @return {Bluebird.Promise} with models.server.Ticket
     */
    create: function(title, description, createdBy, opts) {
        return this.forge({ createdById: Base.toId(createdBy) }, opts)
        .save()
        .then(function(ticket) {
            return Promise.join(
                ticket.addTitle(title, createdBy),
                ticket.addComment(description, createdBy, {
                    textType: opts && opts.textType
                })
            ).return(ticket);
        })
        .then(function(ticket) {
            return ticket.load(["titles", "comments", "comments.createdBy"]);
        })
        .tap(function(ticket) {
            var from = "Opinsys tukipalvelu <"+ ticket.getReplyEmailAddress() +">";
            var title = ticket.relations.titles.first().get("title");
            var comment = ticket.relations.comments.first();

            var description = comment.get("comment");
            var creatorFullName = comment.relations.createdBy.getFullName();
            var subject = 'Uusi tukipyyntö "' + title + '"';

            var text = creatorFullName + " avasi uuden tukipynnön:";
            text += "\n";
            text += "\n";
            text += title;
            text += "\n";
            text += "\n";
            text += description;
            text += "\n";
            text += "\n";
            text += ticket.getURL();

            return ticket.sendMail({
                from: from,
                replyTo: from,
                to: config.forwardTicketsEmail,
                subject: subject,
                text: text
            });
        });
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
        return this.collection().byUserVisibilities(user).query({
            where: { "tickets.id": Base.toId(ticketId) }
        }).fetchOne(_.extend({ require: true }, opts));
    },

});




module.exports = Ticket;

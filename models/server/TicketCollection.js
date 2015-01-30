"use strict";
var Bookshelf = require("bookshelf");

var Base = require("./Base");

/**
 * @namespace models.server
 * @class TicketCollection
 */
var TicketCollection = Bookshelf.DB.Collection.extend({

    initialize: function() {
        this._refSeq = 0;
    },

    /**
     * Generate unique string for this collection instance to be used with SQL
     * joins
     *
     * @private
     * @method _genJoinRef
     * @param {String} [prefix]
     * @return {String}
     */
    _genJoinRef: function(prefix) {
        prefix = prefix || "";
        this._refSeq += 1;
        return prefix + this._refSeq;
    },

    /**
     * Filter this collection with given tag groups. One tag from each tag
     * group must be present for a ticket to be included.
     *
     * Example array of tag groups:
     *
     *     [
     *         // Ticket status must be pending or open
     *         ["status:pending", "status:open"],
     *
     *         // Ticket organisation must be foo or bar
     *         ["organisation:foo", "organisation:bar"],
     *
     *         // Ticket must have an "all" tag
     *         ["all"]
     *     ]
     *
     *
     * @method withTags
     * @param {Array} tagGroups Array of tag groups
     * @return {Bookshelf.Collection} of models.server.Ticket
     */
    withTags: function(tagGroups){
        var self = this;
        return this.query(function(q) {
            tagGroups.forEach(function(tags) {
                var ref = self._genJoinRef("tg");
                q.join("tags as " + ref, "tickets.id", "=", ref + ".ticketId");
                q.whereIn(ref + ".tag", tags);
                q.whereNull(ref + ".deletedAt");
            });
        });
    },

    /**
     * Limit to tickets that have tokens present in the text string.
     *
     * The string is tokenined by space and +
     *
     * @method withText
     * @param {String|Array} text
     */
    withText: function(text) {
        if (Array.isArray(text)) {
            text = text.join(" ");
        }

        var tokens = text.split(/\s|\+/);

        return this.query((q) => {
            var titleRef = this._genJoinRef("title_search");
            var commentRef = this._genJoinRef("comment_search");
            q.join("titles as " + titleRef, "tickets.id", "=", titleRef + ".ticketId");
            q.join("comments as " + commentRef, "tickets.id", "=", commentRef + ".ticketId");

            q.where(function() {
                this.orWhere(function(){
                    [].concat(tokens).forEach((text) => {
                        this.where(titleRef + ".title", "ilike", `%${text}%`);
                    });
                });

                this.orWhere(function(){
                    [].concat(tokens).forEach((text) => {
                        this.where(commentRef + ".comment", "ilike", `%${text}%`);
                    });
                });
            });

            q.whereNull(titleRef + ".deletedAt");
            q.whereNull(commentRef + ".deletedAt");

        });
    },

    /**
     *
     * @method withFollower
     * @param {models.server.User|Number} user
     * @return {Bookshelf.Collection} of models.server.Ticket
     */
    withFollower: function(user){
        var ref = this._genJoinRef("f");
        return this.query(function(q) {
            q.join("followers as " + ref, "tickets.id", "=", ref + ".ticketId");
            q.where(ref + ".followedById", "=",  Base.toId(user));
            q.whereNull(ref + ".deletedAt");
        });
    },

    /**
     *
     * @method withHandler
     * @param {models.server.User|Number} user
     * @return {Bookshelf.Collection} of models.server.Ticket
     */
    withHandler: function(user){
        var ref = this._genJoinRef("f");
        return this.query(function(q) {
            q.join("handlers as " + ref, "tickets.id", "=", ref + ".ticketId");
            q.where(ref + ".handler", "=",  Base.toId(user));
            q.whereNull(ref + ".deletedAt");
        });
    },

    /**
     * Return collection of tickets that have unread comments by the user
     *
     * @method withUnreadComments
     * @param {models.server.User|Number} user
     * @param {Object} [options]
     * @param {Object} [options.byEmail=false] Get tickets by unsent email notifications
     * @return {Bookshelf.Collection} of models.server.Ticket
     */
    withUnreadComments: function(user, options) {
        var attr = "readAt";
        if (options && options.byEmail) {
            attr = "emailSentAt";
        }

        return this.query(function(q) {
                q.distinct()
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
                    "comments.hidden": false, // hidden comment must not emit any notifications
                    "followers.deleted": 0,
                    "followers.followedById": Base.toId(user),
                    "notifications.targetId": Base.toId(user),
                });
            });
    },

    /**
     * Query tickets with visibilities of the user
     *
     * @method
     * @param {models.server.User} user
     */
    byUserVisibilities: function(user) {
        // Manager is not restricted by visibilities. Just return everything.
        if (user.acl.canSeeAllTickets()) return this;
        else return this.byVisibilities(user.getVisibilities());
    },

    /**
     * Fetch tickets by given visibilities.
     *
     * @method byVisibilities
     * @param {Array} visibilities Array of visibility strings. Strings are in the
     * form of `organisation|school|user:<entity id>`.
     *
     *     Example: "school:2"
     *
     * @return {models.server.Base.Collection} with models.server.Ticket models
     */
    byVisibilities: function(visibilities) {
        return this.query(function(queryBuilder) {
                queryBuilder
                .join("visibilities", "tickets.id", "=", "visibilities.ticketId")
                .whereIn("visibilities.entity", visibilities)
                .whereNull("visibilities.deletedAt");
            });
    },

});


module.exports = TicketCollection;

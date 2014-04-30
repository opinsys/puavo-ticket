"use strict";
var _ = require("lodash");
var Promise = require("bluebird");

var Base = require("./Base");
var Comment = require("./Comment");
var Device = require("./Device");
var RelatedUser = require("./RelatedUser");
var Visibility = require("./Visibility");
var Attachment = require("./Attachment");
var Follower = require("./Follower");


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
            created: new Date(),
            updated: new Date()
        };
    },

    /**
     *
     * @method comments
     * @return {Bookshelf.Collection} Bookshelf.Collection of Ticket models
     */
    comments: function() {
        return this.hasMany(Comment, "ticket");
    },


    /**
     *
     * @method visibilities
     * @return {Bluebird.Promise}
     *     resolves to Backbone.Collection of models.server.Visibility wrapped
     *     in a `Promise`.
     */
    visibilities: function() {
        return this.hasMany(Visibility, "ticket");
    },

    /**
     * Add visibility to the ticket
     *
     * @method addVisibility
     * @param {Object} visibility Plain object with models.server.Visibility fields
     * @return {Bluebird.Promise}
     */
    addVisibility: function(visibility) {
        visibility = _.clone(visibility);
        visibility.ticket = this.get("id");
        return Visibility.forge(visibility).save();
    },

    /**
     * Add comment to the ticket
     *
     * @method addComment
     * @param {Object} comment Plain object with models.server.Comment fields
     * @return {Bluebird.Promise}
     */
    addComment: function(comment) {
        comment = _.clone(comment);
        comment.ticket = this.get("id");
        return Comment.forge(comment).save();
    },


    /**
     * Get all updates related to this ticket
     *
     * @method fetchUpdates
     * @return {Bluebird.Promise} Array of Comment|Device|RelatedUser models
     * wrapped in a promise
     */
    fetchUpdates: function() {
        var id = this.get("id");

        var updatePromises = [
            RelatedUser,
            Comment,
            Device
        ].map(function(klass) {
            return klass.collection()
                .query("where", "ticket", "=", id)
                .fetch({ withRelated: "createdBy" });
        });

        return Promise.all(updatePromises)
        .then(function(updates) {

            updates = _.flatten(updates.map(function(coll) {
                return coll.toArray();
            }));

            updates.sort(function(a,b) {
                if ( a.get("updated") > b.get("updated") ) {
                    return 1;
                }
                if ( a.get("updated") < b.get("updated") ) {
                    return -1;
                }

                return 0;

            });

            return updates;
        });

    },

    /**
     * Get all attachments to this ticket
     *
     * @method attachments
     * @return {Bookshelf.Collection} Bookshelf.Collection of Attachment models
     */
    attachments: function() {
        return this.hasMany(Attachment, "ticket");
    },

    /**
     * Add follower to the ticket
     *
     * @method addFollower
     * @param {Object} comment Plain object with models.server.Follower fields
     * @return {Bluebird.Promise}
     */
    addFollower: function(follower) {
        follower = _.clone(follower);
        follower.ticket = this.get("id");
        return Follower.forge(follower).save();
    }

});

/**
 * Fetch tickets by give visibilities.
 *
 * @method fetchByVisibility
 * @param {Array} visibilities Array of visibility strings. Strings are in the
 * form of `organisation|school|user:<entity id>`.
 *
 *     Example: "school:2"
 * @return {Bluebird.Promise} Backbone.Collection of models.server.Ticket
 */
Ticket.fetchByVisibility = function(visibilities) {
    return Ticket
    .collection()
    .query(function(queryBuilder) {
        queryBuilder
        .join("visibilities", "tickets.id", "=", "visibilities.ticket")
        .whereIn("visibilities.entity", visibilities);
    })
    .fetch();
};

module.exports = Ticket;

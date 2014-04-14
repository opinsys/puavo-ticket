"use strict";
var Bookshelf = require("bookshelf");
var Comment = require("./Comment");
var Visibility = require("./Visibility");
var _ = require("lodash");


/**
 * Server Ticket model
 *
 * @namespace models.server
 * @extends Bookshelf.Model
 * @class Ticket
 */
var Ticket = Bookshelf.DB.Model.extend({
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
     * @return {bluebird.Promise}
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
     * @return {bluebird.Promise}
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
     * @return {bluebird.Promise}
     */
    addComment: function(comment) {
        comment = _.clone(comment);
        comment.ticket = this.get("id");
        return Comment.forge(comment).save();
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
 * @return {bluebird.Promise} Backbone.Collection of models.server.Ticket
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

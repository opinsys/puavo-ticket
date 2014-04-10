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
     * @return {bluebird.Promise}
     *     resolves to Backbone.Collection of models.server.Comment wrapped in
     *     a `Promise`.
     */
    comments: function() {
        return this.hasMany(Comment, "ticket");
    },

    visibilities: function() {
        return this.hasMany(Visibility, "ticket");
    },

    addVisibility: function(visibility) {
        return Visibility.forge(_.extend({}, visibility, {
            ticket: this.get("id"),
        })).save();
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

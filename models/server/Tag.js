"use strict";

var Cocktail = require("backbone.cocktail");

require("../../db");

var Base = require("./Base");
var User = require("./User");
var TagMixin = require("../TagMixin");

/**
 * Ticket tags.
 *
 * Tags with a `status:` are handled as a special status tags.
 * Only one tag with the prefix can be active at once.
 *
 * @namespace models.server
 * @class Tag
 * @extends models.server.Base
 * @uses models.TagMixin
 */
var Tag = Base.extend({

    tableName: "tags",

    defaults: function() {
      return {
          createdAt: new Date(),
          updatedAt: new Date()
      };
    },

    initialize: function(attrs, options) {

        this.on("creating", function(tagModel) {
            return tagModel.clones().fetch()
                .bind(this)
                .then(function validateTagUniqueness(collection) {
                    if (collection.size() > 0) {
                        throw new Error("tag " + tagModel.get("tag") + " already exists");
                    }
                })
                .then(function deletePreviousStatustags() {
                    if (tagModel.isStatusTag()) {
                        return Tag.softDeleteStatusTagsFor(
                            tagModel.get("ticketId"),
                            tagModel.get("createdById")
                        );
                    }
                });
        });
    },


    /**
    * Return Collection for clones of this tag
    *
    * @method clones
    * @return {Bookshelf.Collection}
    */
    clones: function(){
        var self = this;
        return Tag.collection()
            .query(function(qb) {
                qb
                .whereNull("deletedAt")
                .andWhere({
                    tag: self.get("tag"),
                    ticketId: self.get("ticketId")
                });
            });
    },

    ticket: function() {
        var Ticket = require("./Ticket");
        return this.belongsTo(Ticket, "ticketId");
    },

    createdBy: function() {
        return this.belongsTo(User, "createdById");
    }


}, {

    /**
     * Soft delete status tags for the given ticket
     *
     * @static
     * @method softDeleteStatusTagsFor
     * @param {models.server.Ticket|Number} ticket Model object or table id
     * @param {models.server.User|Number} byUser The user who deleted the tags
     * @return {Bluebird.Promise}
     */
    softDeleteStatusTagsFor: function(ticket, byUser){
        return Tag.statusTagsFor(ticket).fetch()
            .then(function(coll) {
                return coll.invokeThen("softDelete", byUser);
            });
    },

    /**
     * Fetch all status tags for the given ticket
     *
     * @static
     * @method statusTagsFor
     * @param {models.server.Ticket|Number} ticket Model object or table id
     * @return {Bookshelf.Collection} Collection of models.server.Tag models
     */
    statusTagsFor: function(ticket){
        var ticketId = Base.toId(ticket);
        return Tag.collection()
            .query(function(qb) {
                qb
                .whereNull("deletedAt")
                .andWhere({ ticketId: ticketId })
                .andWhere("tag", "like", "status:%");
            });
    }
});

Cocktail.mixin(Tag, TagMixin);
module.exports = Tag;

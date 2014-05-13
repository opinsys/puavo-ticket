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
          created_at: new Date(),
          updated_at: new Date()
      };
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
                .whereNull("deleted_at")
                .andWhere({
                    tag: self.get("tag"),
                    ticket_id: self.get("ticket_id")
                });
            });
    },

    initialize: function() {
        this.on("creating", function(tagModel) {
            return tagModel.clones().fetch()
                .then(function validateTagUniqueness(collection) {
                    if (collection.size() > 0) {
                        throw new Error("tag already exists");
                    }
                })
                .then(function deletePreviousStatustags() {
                    if (tagModel.isStatusTag()) {
                        return Tag.softDeleteStatusTagsFor(
                            tagModel.get("ticket_id"),
                            tagModel.get("created_by")
                        );
                    }
                });
        });
    },

    createdBy: function() {
        return this.belongsTo(User, "created_by");
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
                .whereNull("deleted_at")
                .andWhere({ ticket_id: ticketId })
                .andWhere("tag", "LIKE", "status:%");
            });
    }
});

Cocktail.mixin(Tag, TagMixin);
module.exports = Tag;

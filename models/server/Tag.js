
"use strict";

require("../../db");


var Base = require("./Base");
var User = require("./User");

/**
 * Ticket tags. Also used as for the ticket status
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class Tag
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
    * Returns true if the tag is a status tag
    *
    * @method isStatusTag
    * @return {Boolean}
    */
    isStatusTag: function() {
      return this.get("tag").indexOf("status:") === 0;
    },

    /**
    * Get status part of the tag if the tag is status tag
    *
    * @method getStatus
    * @return {String}
    */
    getStatus: function() {
      if (!this.isStatusTag()) throw new Error("not a status tag");
      return this.get("tag").replace("^status:");
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
                .then(function(collection) {
                    if (collection.size() > 0) {
                        throw new Error("tag already exists");
                    }
                })
                .then(function() {
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

module.exports = Tag;

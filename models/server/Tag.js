
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
          created: new Date(),
          updated: new Date()
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
      if (!this.isStatusTag) throw new Error("not a status tag");
      return this.get("tag").replace("^status:");
  },

  initialize: function() {
      this.on("creating", function(tagModel) {
            return Tag.collection()
                .query(function(qb) {
                    qb
                    .whereNull("deleted_at")
                    .andWhere({
                        tag: tagModel.get("tag"),
                        ticket_id: tagModel.get("ticket_id")
                    });
                })
                .fetch()
                .then(function(collection) {
                    if (collection.size() > 0) {
                        throw new Error("tag already exists");
                    }
                })
                .then(function() {
                    if (tagModel.isStatusTag()) {
                        return Tag.softDeleteStatusTagsFor(tagModel.get("ticket_id"));
                    }
                });
      });
  },

  createdBy: function() {
      return this.belongsTo(User, "creator_user_id");
  }


}, {

    /**
     * Soft delete status tags for the given ticket
     *
     * @static
     * @method softDeleteStatusTagsFor
     * @param {models.server.Ticket|Number} ticket Model object or table id
     * @return {Bluebird.Promise}
     */
    softDeleteStatusTagsFor: function(ticket){
        return Tag.statusTagsFor(ticket).fetch()
            .then(function(coll) {
                return coll.invokeThen("softDelete");
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

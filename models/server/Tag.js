
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
      this.on("creating", function(model) {
            return Tag.collection()
                .query(function(qb) {
                    qb
                    .whereNull("deleted_at")
                    .andWhere({
                        tag: model.get("tag"),
                        ticket_id: model.get("ticket_id")
                    });
                })
                .fetch()
                .then(function(collection) {
                    if (collection.size() > 0) {
                        throw new Error("tag already exists");
                    }
                })
                .then(function() {
                    if (model.isStatusTag()) {
                        return Tag.softDeleteStatusTags(model.get("ticket_id"));
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
     * @method softDeleteStatusTags
     * @param {models.server.Ticket|Number} ticket Model object or table id
     * @return {Bluebird.Promise}
     */
    softDeleteStatusTags: function(ticket){
        return Tag.fetchStatusTags(ticket)
            .then(function(coll) {
                return coll.invokeThen("softDelete");
            });
    },

    /**
     * Fetch all status tags for the given ticket
     *
     * @static
     * @method fetchStatusTags
     * @param {models.server.Ticket|Number} ticket Model object or table id
     */
    fetchStatusTags: function(ticket){
        var ticketId = Base.toId(ticket);
        return Tag.collection()
            .query(function(qb) {
                qb
                .whereNull("deleted_at")
                .andWhere({ ticket_id: ticketId })
                .andWhere("tag", "LIKE", "status:%");
            })
            .fetch();
    }
});

module.exports = Tag;

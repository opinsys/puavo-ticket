
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

  initialize: function() {
      this.on("creating", function(model) {
            return Tag.collection()
                .query("where", "tag", "=", model.get("tag"))
                .query(function(qb) {
                    qb.whereNull("deleted_at");
                })
                .fetch()
                .then(function(collection) {
                    if (collection.size() > 0) {
                        throw new Error("tag already exists");
                    }
                });
      });
  },

  createdBy: function() {
      return this.belongsTo(User, "creator_user_id");
  }

});

module.exports = Tag;

"use strict";

require("../../db");

var User = require("./User");
var Base = require("./Base");

/**
 * Comment for {{#crossLink "models.server.Ticket"}}{{/crossLink}}
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class Comment
 */
var Comment = Base.extend({

  tableName: "comments",

  defaults: function() {
      return {
          createdAt: new Date(),
          updated_at: new Date()
      };
  },

  createdBy: function() {
      return this.belongsTo(User, "createdById");
  }

});

module.exports = Comment;

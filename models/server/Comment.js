"use strict";

require("../../db");
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
          created: new Date(),
          updated: new Date()
      };
  }

});

module.exports = Comment;

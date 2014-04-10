"use strict";

require("../../db");
var Bookshelf = require("bookshelf");

/**
 * Comment for {{#crossLink "models.server.Ticket"}}{{/crossLink}}
 *
 * @namespace models.server
 * @extends Bookshelf.Model
 * @class Comment
 */
var Comment = Bookshelf.DB.Model.extend({

  tableName: "comments",

  defaults: function() {
      return {
          created: new Date(),
          updated: new Date()
      };
  }

});

module.exports = Comment;

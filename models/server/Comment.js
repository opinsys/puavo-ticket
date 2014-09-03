"use strict";

require("../../db");

var Base = require("./Base");
var User = require("./User");

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
          updatedAt: new Date()
      };
  },

  createdBy: function() {
      return this.belongsTo(User, "createdById");
  },

  ticket: function() {
      var Ticket = require("./Ticket");
      return this.belongsTo(Ticket, "ticketId");
  },

  /**
   * Text for email notification when this model has changed
   *
   * @method textToEmail
   * @return {String}
   */
  textToEmail: function() {
      var self = this;

      return self.get("comment");
  }

});

module.exports = Comment;

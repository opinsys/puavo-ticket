"use strict";

require("../../db");

var User = require("./User");
var Base = require("./Base");

/**
 * Title for {{#crossLink "models.server.Ticket"}}{{/crossLink}}
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class Title
 */
var Title = Base.extend({

  tableName: "titles",

  defaults: function() {
      return {
          createdAt: new Date(),
          updatedAt: new Date()
      };
  },

  createdBy: function() {
      return this.belongsTo(User, "createdById");
  }

});

module.exports = Title;

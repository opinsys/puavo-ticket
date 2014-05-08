"use strict";

require("../../db");

var Base = require("./Base");
var User = require("./User");

/**
 * Devices for {{#crossLink "models.server.Ticket"}}{{/crossLink}}
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class Device
 */
var Device = Base.extend({

  tableName: "devices",

  defaults: function() {
      return {
          created: new Date(),
          updated: new Date()
      };
  },

  createdBy: function() {
      return this.belongsTo(User, "creator_user_id");
  }

});

module.exports = Device;

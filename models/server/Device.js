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
          createdAt: new Date(),
          updatedAt: new Date()
      };
  },

  createdBy: function() {
      return this.belongsTo(User, "createdById");
  }

});

module.exports = Device;

"use strict";

require("../../db");

var Base = require("./Base");

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
  }

});

module.exports = Device;

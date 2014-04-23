"use strict";

require("../../db");
var Bookshelf = require("bookshelf");

/**
 * Devices for {{#crossLink "models.server.Ticket"}}{{/crossLink}}
 *
 * @namespace models.server
 * @extends Bookshelf.Model
 * @class Device
 */
var Device = Bookshelf.DB.Model.extend({

  tableName: "devices",

  defaults: function() {
      return {
          created: new Date(),
          updated: new Date()
      };
  }

});

module.exports = Device;

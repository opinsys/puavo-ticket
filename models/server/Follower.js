"use strict";

require("../../db");

var Base = require("./Base");

/**
 * Followers for {{#crossLink "models.server.Ticket"}}{{/crossLink}}
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class Follower
 */
var Follower = Base.extend({

  tableName: "followers",

  defaults: function() {
      return {
          created_at: new Date(),
          updated_at: new Date()
      };
  }

});

module.exports = Follower;

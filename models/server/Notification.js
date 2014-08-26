"use strict";

require("../../db");

var Base = require("./Base");

/**
 * @namespace models.server
 * @extends models.server.Base
 * @class Notification
 */
var Notification = Base.extend({

  tableName: "notifications",

});

module.exports = Notification;

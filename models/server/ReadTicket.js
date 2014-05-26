"use strict";

require("../../db");

var Base = require("./Base");

/**
 * ReadTickets for {{#crossLink "models.server.Ticket"}}{{/crossLink}}
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class ReadTicket
 */
var ReadTicket = Base.extend({

  tableName: "read_tickets",

});

module.exports = ReadTicket;

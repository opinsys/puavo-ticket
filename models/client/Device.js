"use strict";
var Base = require("./Base");



/**
 * Client Device model
 *
 * @namespace models.client
 * @class Device
 * @extends models.client.Base
 * @uses models.TicketMixin
 */
var Device = Base.extend({

    url: function() {
        return "/api/tickets/" + this.collection.ticketId + "/devices";
    }

});

module.exports = Device;

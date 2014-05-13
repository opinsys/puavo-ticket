"use strict";
var Base = require("./Base");



/**
 * Client Device model
 *
 * @namespace models.client
 * @class Device
 * @extends models.client.Base
 */
var Device = Base.extend({

    url: function() {
        return "/api/tickets/" + this.collection.ticketId + "/devices";
    }

});

module.exports = Device;

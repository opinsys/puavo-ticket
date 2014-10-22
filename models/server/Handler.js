"use strict";

require("../../db");

var Base = require("./Base");
var User = require("./User");


/**
 * Handler for {{#crossLink "models.server.Ticket"}}{{/crossLink}}
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class Handler
 */
var Handler = Base.extend({

    tableName: "handlers",

    defaults: function() {
        return {
            createdAt: new Date(),
            updatedAt: new Date()
        };
    },

    /**
     * @method handler
     * @return {models.server.User}
     */
    handler: function() {
        return this.belongsTo(User, "handler");
    },

    /**
     * @method ticket
     * @return {models.server.Ticket}
     */
    ticket: function() {
        var Ticket = require("./Ticket");
        return this.belongsTo(Ticket, "ticketId");
    },

    /**
     * @method createdBy
     * @return {models.server.User}
     */
    createdBy: function() {
        return this.belongsTo(User, "createdById");
    },

    toJSON: function() {
        // XXX handler field gets overridden by the handler object on the json
        // response. Add the handler id as handledById to it too
        var handledById = this.get("handler");
        var json = Base.prototype.toJSON.apply(this, arguments);
        json.handledById = handledById;
        return json;
    },

});

module.exports = Handler;

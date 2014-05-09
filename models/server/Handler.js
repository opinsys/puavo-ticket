
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
            created_at: new Date(),
            updated_at: new Date()
        };
    },

    handler: function() {
        return this.belongsTo(User, "handler");
    },

    createdBy: function() {
        return this.belongsTo(User, "created_by");
    }

});

module.exports = Handler;

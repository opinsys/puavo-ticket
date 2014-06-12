
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

    initialize: function() {
        this.on("creating", this._assertCreatorIsManager.bind(this));
    },

    _assertCreatorIsManager: function() {
        return User.byId(this.get("created_by"))
            .fetch({ require: true })
            .then(function(user) {
                if (!user.isManager()) {
                    throw new Error("Only managers can add handlers");
                }
            });
    },

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

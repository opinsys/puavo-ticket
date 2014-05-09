"use strict";

require("../../db");
var Base = require("./Base");
var User = require("./User");

/**
 * RelatedUser for {{#crossLink "models.server.Ticket"}}{{/crossLink}}
 *
 * @namespace models.server
 * @extends models.server.Base
 * class RelatedUser
 */
var RelatedUsers = Base.extend({

    tableName: "related_users",

    defaults: function() {
        return {
            created_at: new Date(),
            updated_at: new Date()
        };
    },

    createdBy: function() {
        return this.belongsTo(User, "user");
    }
});

module.exports = RelatedUsers;

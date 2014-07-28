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
            createdAt: new Date(),
            updated_at: new Date()
        };
    },

    user: function() {
        return this.belongsTo(User, "user");
    },

    createdBy: function() {
        return this.belongsTo(User, "createdById");
    }

});

module.exports = RelatedUsers;

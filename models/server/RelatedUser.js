"use strict";

require("../../db");
var Bookshelf = require("bookshelf");

/**
 * RelatedUser for {{#crossLink "models.server.Ticket"}}{{/crossLink}}
 *
 * @namespace models.server
 * @extends Bookshelf.Model
 * class RelatedUser
 */
var RelatedUsers = Bookshelf.DB.Model.extend({

    tableName: "related_users",

    defaults: function() {
        return {
            created: new Date(),
            updated: new Date()
        };
    }
});

module.exports = RelatedUsers;

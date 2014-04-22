"use strict";

require("../../db");
var Bookshelf = require("bookshelf");

/**
 * Server User model
 *
 * @namespace models.server
 * @extends Bookshelf.Model
 * class User
 */
var User = Bookshelf.DB.Model.extend({

    tableName: "users",

    defaults: function() {
        return {
            created: new Date(),
            updated: new Date()
        };
    }
});

module.exports = User;

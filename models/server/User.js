"use strict";

require("../../db");
var Bookshelf = require("bookshelf");
var Cocktail = require("backbone.cocktail");
var UserMixin = require("../UserMixin");

/**
 * Server User model
 *
 * @namespace models.server
 * @extends Bookshelf.Model
 * @class User
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

Cocktail.mixin(User, UserMixin);
module.exports = User;

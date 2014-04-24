"use strict";

require("../../db");
var Base = require("./Base");
var Cocktail = require("backbone.cocktail");
var UserMixin = require("../UserMixin");

/**
 * Server User model
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class User
 */
var User = Base.extend({

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

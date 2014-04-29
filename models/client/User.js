
var Base = require("./Base");
var Cocktail = require("backbone.cocktail");
var UserMixin = require("../UserMixin");

/**
 * Client user mode
 *
 * @namespace models.client
 * @class User
 * @extends models.client.Base
 * @uses models.UserMixin
 */
var User = Base.extend({

});

Cocktail.mixin(User, UserMixin);
module.exports = User;

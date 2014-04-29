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
 * @uses models.UserMixin
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
}, {

    /**
     * Ensure that user from a Opinsys JWT token Object exists and is up to
     * date
     *
     * @method ensureUserFromJWTToken
     * @param {Object} JWT token object from Opinsys SSO
     * @static
     * @return {Bluebird.Promise}
     */
    ensureUserFromJWTToken: function(token) {
        return User.collection()
            .query('where', 'user_id', '=', token.id)
            .fetchOne()
            .then(function(user) {
                if (!user) {
                    return User.forge({
                        user_id: token.id,
                        username: token.username,
                        first_name: token.first_name,
                        last_name: token.last_name,
                        email: token.email,
                        organisation_domain: token.organisation_domain
                        }).save();
                }
                else {
                    user.set("email", token.email);
                    user.set("username", token.username);
                    user.set("first_name", token.first_name);
                    user.set("last_name", token.last_name);
                    return user.save();
                }
            });
    }

});

Cocktail.mixin(User, UserMixin);
module.exports = User;

"use strict";

require("../../db");
var Base = require("./Base");
var Cocktail = require("backbone.cocktail");
var Bookshelf = require("bookshelf");
var UserMixin = require("../UserMixin");
var Puavo = require("../../utils/Puavo");
var config = require("../../config");
var debug = require("debug")("app:server/models/User");

/**
 * Server User model
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class User
 * @uses models.UserMixin
 */
var User = Base.extend({

    tableName: "users",

    defaults: function() {
        return {
            createdAt: new Date(),
            updatedAt: new Date()
        };
    },

    /**
     * Same as models.server.Follower#getSocketIORoom()
     *
     * @method getSocketIORoom
     * @return {String}
     */
    getSocketIORoom: function() {
        return "user:" + this.get("id");
    },

    /**
     * Return true if the user a manager
     *
     * @method isManager
     * @return {Boolean}
     */
    isManager: function(){
        if (!config.managerOrganisationDomain) {
            throw new Error("'managerOrganisationDomain is not configured!");
        }

        return this.getOrganisationDomain() === config.managerOrganisationDomain;
    },

    toJSON: function() {
        var json = Base.prototype.toJSON.apply(this, arguments);
        json.isManager = this.isManager();
        return json;
    }

}, {

    /**
     * Ensure that user from a Opinsys JWT token Object exists and is up to
     * date
     *
     * @method ensureUserFromJWTToken
     * @param {Object} JWT token object from Opinsys SSO
     * @static
     * @return {Bluebird.Promise} models.server.User
     */
    ensureUserFromJWTToken: function(token) {
        return User.byExternalId(token.id).fetch()
            .then(function(user) {
                if (user) return user;

                if (!token.email) return user;

                var emailUser;
                return User.byEmailAddress(token.email).fetch()
                    .then(function(user) {
                        if (!user) return false;

                        emailUser = user;

                        if (!user.get("externalData").id) return false;

                        if (!user.get("externalData").username) return false;

                        var puavo = new Puavo({ domain: user.get("externalData").organisation_domain });

                        return puavo.fetchUserByUsername(user.get("externalData").username);
                    })
                    .then(function(puavoUser) {
                        if (puavoUser !== false && puavoUser !== null) {
                            debug("Error: email address collision!");
                            debug( "JWT token, id: " +
                                   token.id +
                                   ", email: " +
                                   token.email +
                                   ", domain: " +
                                   token.organisation_domain +
                                   ", username: "+
                                   token.username );
                            debug( "puavo-ticket user, externalId: " +
                                   emailUser.get("externalData").id +
                                   ", email: " +
                                   emailUser.get("externalData").email +
                                   ", domain: " +
                                   emailUser.get("externalData").organisation_domain +
                                   ", username: " +
                                   emailUser.get("externalData").organisation_domain );
                            throw new User.EmailCollisionError("Email address collision!");
                        }

                        return emailUser;
                    });
            })
            .then(function(user) {
                if (!user) user = User.forge({});

                user.set({
                    externalId: token.id,
                    externalData: token
                });

                return user.save();
            });
    },

    /**
     * Shortcut for getting user models by the externalId
     *
     * @static
     * @method byExternalId
     * @return {models.server.User}
     */
    byExternalId: function(id) {
        return this.forge({ externalId: id });
    },

    /**
     * Shortcut for getting user models by the email address
     *
     * @static
     * @method byEmailAddress
     * @param {String} emailAddress
     * @return {models.server.User}
     */
    byEmailAddress: function(emailAddress) {
        return this.forge()
            .query(function(qb) {
                qb.where( Bookshelf.DB.knex.raw( "\"externalData\"->>'email' = ?",  [emailAddress] ) );
            });
    },

    /**
     * Fetch user from puavo-rest, save it to the local SQL DB and return it in
     * a Promise.
     *
     * @static
     * @method ensureUserByUsername
     * @param {String} username
     * @param {String} puavoDomain
     * @return {Bluebird.Promise} with models.server.User
     */
    ensureUserByUsername: function(username, puavoDomain) {
        if (!username) throw new Error("Invalid arguments: username is missing");
        if (!puavoDomain) throw new Error("Invalid arguments: puavoDomain is missing");
        var puavo = new Puavo({ domain: puavoDomain });
        return puavo.fetchUserByUsername(username)
            .then(function(userdata) {
                return User.ensureUserFromJWTToken(userdata);
            });
    },

    /**
     * Ensure that user exists for this email address
     *
     * @method ensureUserByEmail
     * @param {String} emailAddress
     * @param {String} first_name
     * @param {String} last_name
     * @return {Bluebird.Promise} models.server.User
     */
    ensureUserByEmail: function(emailAddress, first_name, last_name) {
        return User.byEmailAddress(emailAddress).fetch()
            .then(function(user) {
                if (user) return user;
                return User.forge({
                    externalData: {
                        first_name: first_name,
                        last_name: last_name,
                        email: emailAddress
                    }
                }).save();
            });
    },

    /**
     * Shortcut for getting user model by the username (externalData)
     *
     * @static
     * @method byUsername
     * @return {models.server.User}
     */
    byUsername: function(username) {
        return User.forge()
            .query(function(qb) {
                qb.where( Bookshelf.DB.knex.raw( "externalData->>'username' = ?",  [username] ) );
            });
    },

    EmailCollisionError: EmailCollisionError

});

function EmailCollisionError(message) {
    Error.prototype.constructor.call(this, message);
}

EmailCollisionError.prototype = new Error();

Cocktail.mixin(User, UserMixin);
module.exports = User;

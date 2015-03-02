"use strict";
var Cocktail = require("backbone.cocktail");
var Bookshelf = require("bookshelf");

require("../../db");
var Base = require("./Base");
var Acl = require("../Acl");
var UserMixin = require("../UserMixin");
var Puavo = require("../../utils/Puavo");
var config = require("../../config");
var AccessTag = require("./AccessTag");
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

    initialize: function() {
        this.acl = new Acl(this);
        this.on("saved", () =>
            this.addAccessTag("user:" + this.get("id"), this)
        );
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


    /**
     *
     * @method accessTags
     */
    accessTags: function(){
        return this.hasMany(AccessTag, "userId")
        .query(q => q.where({deleted: 0}));
    },

    /**
     * @method addAccessTag
     * @param {models.server.User|Number} addedBy
     */
    addAccessTag: function(tag, addedBy){
        return AccessTag.fetchOrCreate({
            tag: tag,
            userId: this.get("id"),
            deleted: 0
        }).then(tag => {
            if (tag.isNew()) {
                tag.set({createdById: Base.toId(addedBy)});
                return tag.save();
            }
            return tag;
        });

    },

    /**
     * @method removeAccessTag
     * @param {models.server.User|Number} deletedBy
     */
    removeAccessTag: function(tag, deletedBy) {
        return AccessTag.forge({
            tag: tag,
            userId: this.get("id"),
        }).fetch()
        .then(function(accessTag) {
            if (!accessTag) return;
            return accessTag.softDelete(deletedBy);
        });
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
                            var err = new User.EmailCollisionError("Email address collision!");
                            err.meta = {
                                token: token,
                                collidingUser: emailUser.toJSON()
                            };
                            throw err;
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
                qb.where( Bookshelf.DB.knex.raw( "\"externalData\"->>'email' = ?", [emailAddress] ) );
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
                qb.where(Bookshelf.DB.knex.raw( "externalData->>'username' = ?", [username]));
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

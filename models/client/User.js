"use strict";

var Cocktail = require("backbone.cocktail");
var $ = require("jquery");
var Promise = require("bluebird");

var Base = require("./Base");
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

    /**
     * Return true if the user is a manager
     *
     * @method isManager
     * @return {Boolean}
     */
    isManager: function() {
        return !!this.get("isManager");
    },

}, {

    /**
     * @static
     * @method search
     * @param {String} domain Organisation domain string. Eg. foo.opinsys.fi
     * @return {Bluebird.Promise} Array of user objects
     */
    search: function(domain, keywords) {
        return Promise.cast($.get("/api/puavo/" + domain + "/v3/users/_search", {
                q: keywords
            })).cancellable()
            .then(function(data) {
                var users =  data.map(function(userData) {
                    return new User({
                        externalData: userData
                    });
                });

                return users;
            });
    },
});

Cocktail.mixin(User, UserMixin);
module.exports = User;

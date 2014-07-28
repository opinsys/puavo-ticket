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
     * Return true if the user a manager
     *
     * @method isManager
     * @return {Boolean}
     */
    isManager: function() {
        return !!this.get("isManager");
    },

    getName: function() {
        if (this.get("externalData")) {
            return this.get("externalData").first_name + " " + this.get("externalData").last_name;
        }
    }

}, {

    search: function(keywords) {
        return Promise.cast($.get("/api/puavo/v3/users/_search", {
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

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
    }


    getName: function() {
        if (this.get("external_data")) {
            return this.get("external_data").first_name + " " + this.get("external_data").last_name;
        }
    }

}, {

    search: function(keywords) {
        return Promise.cast($.get("/api/puavo/v3/users/_search", {
                q: keywords
            })).cancellable()
            .catch(function convertJQueryAjaxObjectoToError(err) {
                if (!err.responseText) throw err;
                var ajaxErr = new Error("Ajax error: " + err.responseText);
                ajaxErr.jquery = err;
                throw ajaxErr;
            })
            .then(function(data) {
                var users =  data.map(function(userData) {
                    return new User({
                        external_data: userData
                    });
                });

                return new Base.Collection(users);
            });
    },
});

Cocktail.mixin(User, UserMixin);
module.exports = User;

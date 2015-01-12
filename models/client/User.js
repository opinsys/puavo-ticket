"use strict";

var Cocktail = require("backbone.cocktail");
var url = require("url");

var Acl = require("../Acl");
var fetch = require("../../utils/fetch");
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

    initialize: function() {
        this.acl = new Acl(this);
    },

    /**
     * Update user data from puavo-rest
     *
     * @method sync
     * @return {Bluebird.Promise} with models.client.User
     */
    sync: function() {
        var self = this;
        return fetch.post("/api/users", {
            username: this.getUsername(),
            domain: this.getOrganisationDomain()
        }).then(function(res) {
            var m = self.optionsClone(res.data);
            self.trigger("replace", m);
            return m;
        });
    },

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
     * @param {String} keywords Keywords used to search users
     * @return {Bluebird.Promise} Array of user objects
     */
    search: function(domain, keywords) {
        return fetch.get(url.format({
            pathname: "/api/puavo/" + domain + "/v3/users/_search",
            query: {q: keywords}
        }))
        .cancellable()
        .then(function(res) { return res.data; })
        .map(function(data) {
            return new User({ externalData: data });
        });
    },
});

Cocktail.mixin(User, UserMixin);
module.exports = User;

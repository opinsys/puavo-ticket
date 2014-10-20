"use strict";
var $ = require("jquery");
var Promise = require("bluebird");

var Base = require("./Base");
var User = require("./User");

/**
 * Ticket follower model for the client
 *
 * @namespace models.client
 * @class Handler
 * @extends models.client.Base
 */
var Follower = Base.extend({

    defaults: function() {
        return {
            type: "followers",
            createdAt: new Date().toString()
        };
    },

    relationsMap: function() {
        return {
            follower: User
        };
    },

    url: function() {
        if (this.isNew()) {
            return this.parent.url() + "/followers";
        } else {
            return this.parent.url() + "/followers/" + this.get("followedById");
        }
    },

    /**
     * @method destroy
     * @return {Bluebird.Promise}
     */
    destroy: function() {
        return Promise.cast($.ajax({
           url: this.url(),
           type: "DELETE"
        }));
    },

    /**
     * Return the handler user object
     *
     * @method getUser
     * @return {models.client.User}
     */
    getUser: function(){
        return this.rel("follower");
    },

});


module.exports = Follower;

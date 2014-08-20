"use strict";
var _ = require("lodash");

var Base = require("./Base");
var User = require("./User");
var UpdateMixin = require("./UpdateMixin");


/**
 * Ticket handler model for the client
 *
 * @namespace models.client
 * @class Handler
 * @extends models.client.Base
 * @uses models.client.UpdateMixin
 */
var Handler = Base.extend({

    defaults: function() {
        return {
            type: "handlers",
            createdAt: new Date().toString()
        };
    },

    url: function() {
        return this.parent.url() + "/handlers";
    },

    /**
     * Return the handler user object
     *
     * @method getUser
     * @return {models.client.User}
     */
    getUser: function(){
        return new User(this.get("handler"));
    },

});

_.extend(Handler.prototype, UpdateMixin);

module.exports = Handler;

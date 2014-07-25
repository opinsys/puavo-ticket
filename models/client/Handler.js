"use strict";
var Base = require("./Base");
var User = require("./User");


/**
 * Ticket handler model for the client
 *
 * @namespace models.client
 * @class Handler
 * @extends models.client.Base
 */
var Handler = Base.extend({

    defaults: function() {
        return {
            type: "handlers",
            created_at: new Date().toString()
        };
    },

    url: function() {
        return this.parent.url() + "/handlers";
    },

    /**
     * Return the handler user object
     *
     * @method getHandlerUser
     * @return {models.client.User}
     */
    getHandlerUser: function(){
        return new User(this.get("handler"));
    },

});

module.exports = Handler;

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

    /**
     * Return the handler user object
     *
     * @method getHandlerUser
     * @return {models.client.User}
     */
    getHandlerUser: function(){
        return new User(this.get("handler"));
    },

    save: function() {
        throw new Error("Fix handler save...");
        // var self = this;

        // return Promise.cast($.post(this.parent.url() + "/handlers", {
        //         username: this.getHandlerUser().get("external_data").username,
        //         organisation_domain: this.getHandlerUser().get("external_data").organisation_domain
        //     }))
        //     .then(function(res) {
        //         self.set(res);
        //     });
    },

});

module.exports = Handler;

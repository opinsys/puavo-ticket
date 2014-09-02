"use strict";

require("../../db");

var Base = require("./Base");
var User = require("./User");

/**
 * Followers for {{#crossLink "models.server.Ticket"}}{{/crossLink}}
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class Follower
 */
var Follower = Base.extend({

    tableName: "followers",

    defaults: function() {
        return {
            createdAt: new Date(),
            updatedAt: new Date()
        };
    },

    /**
     * @method getSocketIORoom
     * @return {String}
     */
    getSocketIORoom: function() {
        return "user:" + this.get("followedById");
    },

    follower: function() {
        return this.belongsTo(User, "followedById");
    },

    createdBy: function() {
        return this.belongsTo(User, "createdById");
    }

});


module.exports = Follower;

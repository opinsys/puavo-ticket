"use strict";

require("../../db");

var Base = require("./Base");

/**
 * @namespace models.server
 * @extends models.server.Base
 * @class Notification
 */
var Notification = Base.extend({

  tableName: "notifications",

}, {

    /**
     * @static
     * @method fetchFollowerNotifications
     * @param {models.server.User|Number} user
     * @return XXX
     */
    fetchFollowerNotifications: function(user){
        return this.collection()
            .query(function(qb) {
                qb
                .join("followers", function() {
                    this.on("notifications.targetId", "=", "followers.followedById");
                    this.on("notifications.ticketId", "=", "followers.ticketId");
                    // this.on("notifications.ticketId", "=", "tickets.id");
                })
                .whereNull("followers.deletedAt")
                .where({
                    "followers.deleted": 0,
                    "followers.followedById": Base.toId(user),
                    "notifications.targetId": Base.toId(user),
                    "notifications.unread": true
                });
            })
            .fetch();
    },
});

module.exports = Notification;

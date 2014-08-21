"use strict";

var UpdateMixin = {

    /**
     * Return Date object when the update was created
     *
     * @method createdAt
     * @return {Date}
     */
    createdAt: function() {
        return new Date(this.get("createdAt"));
    },

    /**
     * Return true of the given user has read this update
     *
     * @method isUnreadBy
     * @param {models.client.User} user
     * @return {Boolean}
     */
    isUnreadBy: function(user){
        if (user.isSame(this.createdBy())) return false;
        return this.parent.getReadAtFor(user).getTime() - this.createdAt().getTime() < 0;
    }

};


module.exports = UpdateMixin;

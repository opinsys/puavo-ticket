"use strict";


/**
 * Methods shared between every client and server model
 *
 * @namespace models
 * @class BaseMixin
 */
var BaseMixin = {

    /**
     * @method createdAt
     * @return {Date}
     */
    createdAt: function() {
        return new Date(this.get("created_at"));
    },

    /**
     * @method isSoftDeleted
     * @return {Boolean}
     */
    isSoftDeleted: function() {
        return !!this.get("deleted_at");
    },

    /**
     * @method deletedAt
     * @return {Date}
     */
    deletedAt: function() {
        if (this.isSoftDeleted()) {
            return new Date(this.get("deleted_at"));
        }

        return null;
    },

    /**
     * Return true if the other object is built using the same constructor and
     * they have the same id
     *
     * @method isSame
     * @param {Backbone.Model} other
     * @return Boolean
     */
    isSame: function(other){
        if (!other || !other.get("id")) return false;
        if (other.constructor !== this.constructor) return false;
        return String(this.get("id")) === String(other.get("id"));
    }

};

module.exports = BaseMixin;

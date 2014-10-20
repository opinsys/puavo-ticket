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
        return new Date(this.get("createdAt"));
    },

    /**
     * @method updatedAt
     * @return {Date}
     */
    updatedAt: function() {
        return new Date(this.get("updatedAt"));
    },

    /**
     * @method isSoftDeleted
     * @return {Boolean}
     */
    isSoftDeleted: function() {
        return !!this.get("deletedAt");
    },

    /**
     * @method deletedAt
     * @return {Date}
     */
    deletedAt: function() {
        if (this.isSoftDeleted()) {
            return new Date(this.get("deletedAt"));
        }

        return null;
    },

    /**
     * Return relation data for given key or throw if it's not loaded
     *
     * @method rel
     * @param {String} key
     * @return {Object|Array} Relation data
     */
    rel: function(key) {
        var rel = this.relations[key];
        if (!rel) throw new Error("Relation '" + key + "' is not loaded");
        return rel;
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

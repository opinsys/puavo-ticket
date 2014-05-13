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

};

module.exports = BaseMixin;

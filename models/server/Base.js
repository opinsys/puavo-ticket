"use strict";

var Bookshelf = require("bookshelf");


/**
 * Base class for server Models
 *
 * @namespace models.server
 * @extends Bookshelf.Model
 * @class Base
 */
var Base = Bookshelf.DB.Model.extend({

    virtuals: {

        /**
         * Unique id between tables.
         *
         * Virtual database field. Use .get("unique_id") to access it.
         *
         * @property unique_id
         * @type String
         */
        unique_id: {
            get: function() {
                if (!this.id) return;
                return this.get("type") + ":" + this.id;
            },
            // no actual database presentation
            set: function() { },
        },

        /**
         * The database table name
         *
         * Virtual database field. Use .get("type") to access it.
         *
         * @property type
         * @type String
         */
        type: {
            get: function() {
                return this.constructor.prototype.tableName;
            },
            // no actual database presentation
            set: function() { }
        }

    },

    /**
     * Set timestamp to deleted_at
     *
     * @method softDelete
     */
    softDelete: function(){
        this.set("deleted_at", new Date());
        return this.save();
    }
}, {

    /**
     * Shortcut for fetching models by id
     *
     * @static
     * @method fetchById
     * @return {models.server.Base} subclass of models.server.Base
     */
    fetchById: function(id) {
        return this.forge({ id: id }).fetch();
    },

    /**
     * Return id for the model or just return the id if the id itself is
     * passed.
     *
     * @static
     * @method toId
     * @param {Backbone.Model|Bookshelf.Model} model
     * @return {Number}
     */
    toId: function(model) {
        if (typeof model.get === "function") return model.get("id");
        return model;

    }


});

module.exports = Base;

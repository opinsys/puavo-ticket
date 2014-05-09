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
     * @param {models.server.User|Number} byUser The user who deleted the model
     * @return {Bluebird.Promise}
     */
    softDelete: function(byUser){
        if (!byUser) {
            throw new Error("softDelete requires a byUser argument");
        }
        this.set({
            deleted_by: Base.toId(byUser),
            deleted_at: new Date()
        });
        return this.save();
    }
}, {

    /**
     * Shortcut for getting models by id
     *
     * @static
     * @method byId
     * @return {models.server.Base} subclass of models.server.Base
     */
    byId: function(id) {
        return this.forge({ id: id });
    },

    /**
     * Return id for the model or just return the id if the id itself is
     * passed.
     *
     * @static
     * @method toId
     * @param {Backbone.Model|Bookshelf.Model|mixed} model
     * @return {Number}
     */
    toId: function(model) {
        return this.toAttr(model, "id");
    },

    /**
     * Get attribute using get() if model is Model instance or just return the
     * value
     *
     * @static
     * @method toAttr
     * @param {Backbone.Model|Bookshelf.Model|mixed} model
     * @param {String} attr Attribute to get from the model
     * @return {mixed}
     */
    toAttr: function(model, attr) {
        if (typeof model.get === "function") return model.get(attr);
        return model;
    }


});

module.exports = Base;

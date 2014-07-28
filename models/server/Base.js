"use strict";

require("../../db");
var Bookshelf = require("bookshelf");
var Cocktail = require("backbone.cocktail");

var BaseMixin = require("../BaseMixin");


/**
 * Base class for server Models
 *
 * @namespace models.server
 * @extends Bookshelf.Model
 * @class Base
 * @uses models.BaseMixin
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
            deletedById: Base.toId(byUser),
            deleted_at: new Date(),
            deleted: this.get("id")
        });
        return this.save();
    }
}, {

    /**
     * Shortcut for getting models by id
     *
     * @static
     * @method byId
     * @param {Number|models.server.Base} id
     * @return {models.server.Base} subclass of models.server.Base
     */
    byId: function(id) {
        return this.forge({ id: Base.toId(id) });
    },

    /**
     * Return id for the model or just return the id if the id itself is
     * passed.
     *
     * @static
     * @method toId
     * @param {Backbone.Model|any} model
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
     * @param {Backbone.Model|any} model
     * @param {String} attr Attribute to get from the model
     * @return {mixed}
     */
    toAttr: function(model, attr) {
        if (this.isModel(model)) return model.get(attr);
        return model;
    },

    /**
     * Returns true if the given value is a Backbone.Model like object
     *
     * @static
     * @method isModel
     * @param {any}
     * @return {Boolean}
     */
    isModel: function(model) {
        if (!model) return false;
        return typeof model.get === "function";
    }

});


Cocktail.mixin(Base, BaseMixin);
module.exports = Base;

"use strict";

var Promise = require("bluebird");

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
     * @method uniqueId
     * @return {String}
     */
    getUniqueId: function() {
        var type = this.tableName;
        var id = this.get("id");
        if (!id || !type) throw new Error("bad unique id");
        return type + "-" + id;
    },

    /**
     * Save the model if this.isNew() returns true
     *
     * @method ensureSaved
     * @return {Bluebird.Promise} with the model instance
     */
    ensureSaved: function(createdBy){
        if (this.isNew()) {
            this.set({ createdById: Base.toId(createdBy) });
            return this.save();
        }
        return Promise.resolve(this);
    },

    /**
     * Set timestamp to deletedAt
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
            deletedAt: new Date(),
            deleted: this.get("id")
        });
        return this.save();
    }
}, {

    /**
     * Fetch or create a model uniquely identified by the columns defined in
     * the `identifier`
     *
     * @method fetchOrCreate
     * @param {Object} identifier Object of table columns
     * @param {Object} [options]
     * @param {Object} [options.noSoftDeleted] Set to true to ignore soft deleted items
     * @return {Bluebird.Promise} with the model instance
     */
    fetchOrCreate: function(identifier, options) {

        if (options && options.noSoftDeleted) {
            identifier.deleted = 0;
        }

        var model = this.forge(identifier);

        return model.fetch()
        .then(function(existing) {
            return existing || model;
        });
    },


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
        if (!model) throw new Error("Cannot get id for a falsy value!");
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

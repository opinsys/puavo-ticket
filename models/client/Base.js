/**
 * @namespace models.client
 */
"use strict";
var Backbone = require("backbone");
var _ = require("lodash");
var $ = require("jquery");
var Promise = require("bluebird");
var Cocktail = require("backbone.cocktail");

var BaseMixin = require("../BaseMixin");


function createReplaceMixin(parentPrototype) {
    return {

        /**
         * Fetch model state from the server
         * http://backbonejs.org/#Model-fetch
         *
         * @method fetch
         * @return {Bluebird.Promise}
         */
        fetch: function() {
            if (this.parent) {
                throw new Error("This is a child model. Use fetchParent() to get new parent");
            }

            if (this._type === "model" && !this.get("id")) {
                throw new Error("fetch() without id makes no sense on a model");
            }

            var op = Promise.cast($.get(_.result(this, "url")))
            .bind(this)
            .then(function(res) {
                return new this.constructor(res);
            });

            this.trigger("replace", op);
            return op;
        },

        fetchParent: function() {
            if (this.parent) return this.parent.fetchParent();
            return this.fetch();
        },

        replaceFetch: function(a, b) {
            console.error("deprecated replaceFetch");
            return this.fetch(a, b);
        },

    };
}


/**
 * Base class for client models
 *
 * http://backbonejs.org/#Model
 *
 * @class Base
 * @extends Backbone.Model
 * @uses models.client.ReplaceMixin
 * @uses models.BaseMixin
 * @see http://backbonejs.org/#Model
 */
var Base = Backbone.Model.extend({

    _type: "model",

    constructor: function(attrs, opts) {
        this.parent = opts && opts.parent;
        Backbone.Model.apply(this, arguments);
        this._freeze();
    },

    _freeze: function() {
        this._set = this.set;
        this.set = function() {
            throw new Error("Do not mutate models");
        };
    },

    _unfreeze: function() {
        this.set = this._set;
    },


    isOperating: function() {
        console.error("Deprecated isOperating() call");
        return false;
    },

    createdBy: function() {
        var User = require("./User");
        return new User(this.get("createdBy"));
    },

    push: function(attr, value) {
        var array = this.get(attr);
        array.push(value);
        this.set(attr, array);
    },

    /**
     *
     * Use unique_id from {{#crossLink "models.server.Base"}}{{/crossLink}} as
     * the model id.
     *
     * We need this to be able to put models of diffent type to a single
     * Backbone collection
     *
     * http://backbonejs.org/#Model-idAttribute
     *
     * @property idAttribute
     * @type String
     */
    idAttribute: "unique_id",



    /**
     * Save module to server
     * http://backbonejs.org/#Model-save
     *
     * @method save
     * @return {Bluebird.Promise}
     */
    save: function(attrs, opts) {
        if (!attrs || _.isEmpty(attrs)) throw new Error("Missing attrs!");


        // XXX does this make sense?
        if (!this.isNew()) throw new Error("Only new models can be saved!");

        return Promise.cast($.post(_.result(this, "url"), attrs))
            .bind(this)
            .then(function(res) {
                return new this.constructor(res);
            });

    },

    replaceSave: function(attrs, opts) {
        console.error("deprecated replaceSave");
        return this.save(attrs, opts);
    },


    /**
     * Promise of the saving operation instantiated by Base#save().  Available
     * only when the operation is ongoing.
     *
     * @property saving
     * @type Bluebird.Promise|null
     */
    saving: null,

    /**
     * Call when not using this model anymore. Unbinds all event listeners.
     *
     * @method dispose
     */
    dispose: function() {
        this.off();
    }

}, {

    /**
     * Create instance of models.client.Base.Collection with this model class
     * as the `model` property
     *
     * @static
     * @method collection
     * @param {Array} [models] Array of models.client.Base models
     * @param {Object} [options] http://backbonejs.org/#Collection-constructor
     * @return {models.client.Base.Collection}
     */
    collection: function(models, options) {
        var Klass = this.Collection.extend({
            model: this
        });
        return new Klass(models, options);
    },

});

/**
 * Base class for client model collections
 *
 * http://backbonejs.org/#Collection
 *
 * @class Base.Collection
 * @extends Backbone.Collection
 * @uses models.client.ReplaceMixin
 */
Base.Collection = Backbone.Collection.extend({

    _type: "collection",

    /**
     * http://backbonejs.org/#Collection-model
     *
     * @property model
     * @type models.client.Base
     */
    model: Base


});


Cocktail.mixin(Base, BaseMixin);
_.extend(Base.prototype, createReplaceMixin(Backbone.Model.prototype));
_.extend(Base.Collection.prototype, createReplaceMixin(Backbone.Collection.prototype));
_.extend(Base, Backbone.Events);
module.exports = Base;

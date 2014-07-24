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
            if (this.parent) throw new Error("Models with parents are fetched by parents");

            if (this._type === "model" && !this.get("id")) {
                throw new Error("fetch() without id makes no sense on a model");
            }

            console.log("real fetch", this.cid);
            return Promise.cast(parentPrototype.fetch.apply(this, arguments));
        },

        replaceFetch: function() {
            console.log("replaceFetch", this.cid);
            if (this.parent) {
                this.parent.replaceFetch();
                return;
            }

            var replaceModel = this.clone();
            var op = replaceModel.fetch()
                .then(function() { return replaceModel; });

            this.trigger("replace", op);
            return op;
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

    initialize: function(attrs, options) {
        this.parent = options && options.parent;
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
    save: function(opts) {
        if (!this.isNew()) throw new Error("Only new models can be saved with save() Use replaceSave() or setSave()");
        return this.replaceSave(this.toJSON(), opts);
    },

    setSave: function(attrs, opts) {
        return this.replaceSave(_.extend({}, this.toJSON(), attrs), opts);
    },

    replaceSave: function(attrs, opts) {
        opts = opts || {};
        return Promise.cast($.post(_.result(this, "url"), attrs))
            .bind(this)
            .then(function(res) {
                return new this.constructor(res);
            });
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
    model: Base,

    /**
     * Fetch models from the server
     * http://backbonejs.org/#Collection-fetch
     *
     * @method fetch
     * @return {Bluebird.Promise}
     */
    fetch: function() {
        return Promise.cast(Backbone.Collection.prototype.fetch.apply(this, arguments));
    },

});


Cocktail.mixin(Base, BaseMixin);
Cocktail.mixin(Base, createReplaceMixin(Backbone.Model.prototype));
Cocktail.mixin(Base.Collection, createReplaceMixin(Backbone.Collection.prototype));
_.extend(Base, Backbone.Events);
module.exports = Base;

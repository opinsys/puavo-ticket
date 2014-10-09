/**
 * @namespace models.client
 */
"use strict";
var Backbone = require("backbone");
var _ = require("lodash");
var $ = require("jquery");
var Promise = require("bluebird");
var Cocktail = require("backbone.cocktail");
var url = require("url");

var BaseMixin = require("../BaseMixin");


function createReplaceMixin(parentPrototype) {
    return {

        initialize: function(data, options) {
            this.options = options || {};
            this.query = this.options.query;
            if (this.options.url) {
                this.url = options.url;
            }
        },

        /**
         * Return empty clone of this model instance with same options
         *
         * @method optionsClone
         * @return {models.server.Base}
         */
        optionsClone: function(data) {
            return new this.constructor(data, _.extend(
                {}, this.options, { parent: this.parent }
            ));
        },


        /**
         * Fetch model state from the server
         * http://backbonejs.org/#Model-fetch
         *
         * @method fetch
         * @param {Object} [options]
         * @param {Object} [options.query]
         * @return {Bluebird.Promise}
         */
        fetch: function(options) {
            if (this.parent) {
                throw new Error("This is a child model. Use fetchParent() to get a new parent");
            }

            if (this._type === "model" && !this.get("id")) {
                throw new Error("fetch() without id makes no sense on a model");
            }


            var resourceURL = url.parse(_.result(this, "url"));
            resourceURL = url.format({
                pathname: resourceURL.pathname,
                query: _.extend({}, resourceURL.query, this.query, options && options.query)
            });

            var op = Promise.resolve($.get(resourceURL))
            .bind(this)
            .catch(function(err) {
                if (err && err.status === 404) {
                    throw new NotFound("404 response from API", url, err);
                }
                throw err;
            })
            .then(function(res) {
                return this.optionsClone(res);
            });

            this.trigger("replace", op);
            return op;
        },

        fetchParent: function() {
            if (this.parent) return this.parent.fetchParent();
            return this.fetch();
        },

    };
}

function disabledMethod(name) {
    /*jshint validthis:true */
    this[name] = function() {
        throw new Error("Do not mutate existing instances. Create new instances if you need to mutate anything.");
    };
}

/**
 * Not found error class for 404 api errors
 *
 * @class Base.NotFound
 * @constructor
 * @param {String} message
 * @param {String} url
 * @param {Object} xhr The ajax request
 */
function NotFound(message, url, xhr) {
    this.name = "NotFound";
    this.url = url;
    this.xhr = xhr;
    this.message = message;
}
NotFound.prototype = new Error();

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
        ["set", "clear", "unset"].forEach(disabledMethod.bind(this));
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
     * @method uniqueId
     * @return {String}
     */
    getUniqueId: function() {
        var type = this.get("type");
        var id = this.get("id");
        if (!id || !type) throw new Error("bad unique id");
        return type + "-" + id;
    },

    /**
     * Return relation data for given key or throw if it's not loaded
     *
     * @method rel
     * @param {String} key
     * @return {Object|Array} Relation data
     */
    rel: function(key){
        var data = this.get(key);
        if (!data) {
            var err =  new Error("Relation for key '" + key + "' is not loaded for '" + this.get("type") + "' model");
            err.model = this;
            throw err;
        }
        return data;
    },


    /**
     * Save model to server
     * http://backbonejs.org/#Model-save
     *
     * @method save
     * @return {Bluebird.Promise} with the new saved model
     */
    save: function() {
        if (!this.isNew()) throw new Error("Only new models can be saved!");

        return Promise.resolve($.post(_.result(this, "url"), this.toJSON()))
            .bind(this)
            .then(function(res) {
                return this.optionsClone(res);
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
    },

    /**
     * Return true if the another model was created within 60 seconds of this
     * one by the same user
     *
     * @method wasCreatedInVicinity
     * @return {Boolean}
     */
    wasCreatedInVicinityOf: function(another) {
        if (this.get("createdById") !== another.get("createdById")) return false;
        var diff = Math.abs(another.createdAt().getTime() - this.createdAt().getTime());
        return diff < 60*1000;
    },

}, {

    NotFound: NotFound,

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

    constructor: function() {
        Backbone.Collection.apply(this, arguments);
        [
            "add",
            "remove",
            "push",
            "pop",
            "sort",
            "unshift",
            "shift"
        ].forEach(disabledMethod.bind(this));
    },

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

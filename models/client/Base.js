/**
 * @namespace models.client
 */
"use strict";
var Backbone = require("backbone");
var _ = require("lodash");
var Cocktail = require("backbone.cocktail");
var url = require("url");

var fetch = require("../../utils/fetch");
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
         * Create new instance of the same model and options but with new data
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

            var op = fetch.get(resourceURL)
            .bind(this)
            .then(function(res) {
                return this.optionsClone(res.data);
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


var defaultRelationsMap = function() {
    return { createdBy: require("./User") };
};

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


    /**
     *
     * @property relationsMap
     * @type {Object}
     */
    relationsMap: {},

    /**
     * The same as http://bookshelfjs.org/#Model-relations
     *
     * @property relations
     * @type {Object}
     */
    relations: null,

    constructor: function(attrs, opts) {
        var self = this;
        this.parent = opts && opts.parent;
        Backbone.Model.apply(this, arguments);

        self.relations = {};
        var map = _.extend(
            {}, defaultRelationsMap(), _.result(self, "relationsMap")
        );

        _.forOwn(map, function(Klass, key) {
            if (!Klass) return;
            var data = self.get(key);
            if (typeof data === "undefined") return;

            if (_.isArray(data)) {
                self.relations[key] = Klass.collection(data, null, { parent: self });
            } else {
                self.relations[key] = new Klass(data, { parent: self });
            }
        });

        ["set", "clear", "unset"].forEach(disabledMethod.bind(this));
    },

    isOperating: function() {
        console.error("Deprecated isOperating() call");
        return false;
    },

    createdBy: function() {
        return this.rel("createdBy");
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
     * Save model to server
     * http://backbonejs.org/#Model-save
     *
     * @method save
     * @param {Object} [customData] Custom data to be saved instead of this model
     * @return {Bluebird.Promise} with the new saved model
     */
    save: function(customData) {
        var self = this;
        if (!this.isNew()) throw new Error("Only new models can be saved!");
        return fetch.post(_.result(this, "url"), customData || this.toJSON())
        .then(function(res) {
            return self.optionsClone(res.data);
        });

    },

    /**
     * @method destroy
     * @return {Bluebird.Promise}
     */
    destroy: function() {
        return fetch.delete(this.url());
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

    Collection: Backbone.Collection.extend({

        _type: "collection",

        url: function() {
            return this.model.prototype.collectionURL;
        },

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
        }
    }),

    /**
     * Return empty collection of tickets
     *
     * @static
     * @method collection
     * @param {Array} [models]
     * @param {Object} [options]
     * @param {Object} [modelOptions]
     * @return {models.client.Ticket.Collection}
     */
    collection: function(models, options, modelOptions) {

        var Klass = this.Collection.extend({ model: this });
        var self = this;
        models = (models || []).map(function(attrs) {
            return new self(attrs, modelOptions);
        });
        return new Klass(models, options);
    },

});




Cocktail.mixin(Base, BaseMixin);
_.extend(Base.prototype, createReplaceMixin(Backbone.Model.prototype));
_.extend(Base.Collection.prototype, createReplaceMixin(Backbone.Collection.prototype));
_.extend(Base, Backbone.Events);
module.exports = Base;

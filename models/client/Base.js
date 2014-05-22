/**
 * @namespace models.client
 */
"use strict";
var Backbone = require("backbone");
var _ = require("lodash");
var Promise = require("bluebird");
var Cocktail = require("backbone.cocktail");

var BaseMixin = require("../BaseMixin");

function proxyToBase() {
    /*jshint validthis:true */
    this.on("all", function(eventName) {
        console.log("Backbone event", eventName);
        Base.trigger(eventName);
    });
}

/**
 * Decorate method execution with `<eventName>:start` and `<eventName>:end`
 * events and wrap output to a bluebird promise. During promise resolution the
 * promise is available in `this[eventName]`.
 *
 *
 * @method promiseWrap
 * @static
 * @private
 * @for models.client.Base
 * @param {String} eventName
 * @param {Function} method
 */
function promiseWrap(eventName, method) {
    return function() {
        var self = this;
        self.trigger(eventName + ":start");

        self[eventName] = Promise.cast(method.apply(self, arguments))
        .then(function(res) {
            self[eventName] = null;
            self.trigger(eventName + ":end");
            return res;
        })
        .catch(function(err) {
            // jQuery returns an xhr object as the error object. Convert it to
            // a proper error object
            if (err && err.responseText !== undefined) {
                var xhr = err;
                err = new Error("Bad request " + xhr.status + ": " + xhr.responseText);
                err.xhr = xhr;
            }

            // Emit event after this catch clause has been executed. This
            // ensures that the promise is actually rejected when a render
            // occurs
            process.nextTick(function(err) {
                self.trigger(eventName + ":error", err);
            });

            throw err;
        });

        return self[eventName];
    };
}

/**
 * @class PromiseWrapMixin
 */
var PromiseWrapMixin = {

    /**
     * Return true when the model is fetching or saving data
     *
     * @method isOperating
     * @return {Boolean}
     */
    isOperating: function() {
        return !!(this.saving || this.fetching);
    },

    /**
     *
     * Returns an error object if .fetch() or .save() has been failed.
     *
     * @method getError
     * @return {Error|Undefined}
     */
    getError: function() {
        var promise = this.saving || this.fetching;
        if (promise && promise.isRejected()) {
            return promise.reason();
        }
    }

};


/**
 * Base class for client models
 *
 * http://backbonejs.org/#Model
 *
 * @class Base
 * @extends Backbone.Model
 * @uses models.client.PromiseWrapMixin
 * @uses models.BaseMixin
 * @see http://backbonejs.org/#Model
 */
var Base = Backbone.Model.extend({

    initialize: proxyToBase,

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
     * Fetch model state from the server
     * http://backbonejs.org/#Model-fetch
     *
     * @method fetch
     * @return {Bluebird.Promise}
     */
    fetch: promiseWrap("fetching", Backbone.Model.prototype.fetch),

    /**
     * Promise of the fetching operation instantiated by Base#fetch().
     * Available only when the operation is ongoing.
     *
     * @property fetching
     * @type Bluebird.Promise|null
     */
    fetching: null,

    /**
     * Save module to server
     * http://backbonejs.org/#Model-save
     *
     * @method save
     * @return {Bluebird.Promise}
     */
    save: promiseWrap("saving", Backbone.Model.prototype.save),

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
 * @uses models.client.PromiseWrapMixin
 */
Base.Collection = Backbone.Collection.extend({

    initialize: proxyToBase,

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
    fetch: promiseWrap("fetching", Backbone.Collection.prototype.fetch),

    /**
     * Promise of the fetching operation instantiated by
     * Base.Collection#fetch(). Available only when the operation is ongoing.
     *
     * @property fetching
     * @type Bluebird.Promise|null
     */
    fetching: null,

    /**
     * Call when not using this Collection anymore. Unbinds all event
     * listeners.
     *
     * @method dispose
     */
    dispose: function() {
        this.off();
    }
});




Cocktail.mixin(Base, BaseMixin);
Cocktail.mixin(Base, PromiseWrapMixin);
Cocktail.mixin(Base.Collection, PromiseWrapMixin);
_.extend(Base, Backbone.Events);
module.exports = Base;

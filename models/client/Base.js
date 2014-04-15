"use strict";
var Backbone = require("backbone");
var Promise = require("bluebird");

/**
 * Decorate method execution with `<eventName>:start` and `<eventName>:end`
 * events and wrap output to a bluebird promise. During promise resolution the
 * promise is available in `this[eventName]`.
 *
 *
 * @method promiseWrap
 * @static
 * @private
 * @param {String} eventName
 * @param {Function} method
 */
function promiseWrap(eventName, method) {
    return function() {
        var self = this;
        self.trigger(eventName + ":start");

        self[eventName] = Promise.delay(10) // simulate slow network
        .then(function() {
            return Promise.cast(method.apply(self, arguments));
        })
        .then(function() {
            self[eventName] = null;
            self.trigger(eventName + ":end");
        })
        .catch(function(err) {
            // jQuery returns an xhr object as the error object. Convert it to
            // a proper error object
            if (err && err.responseText !== undefined) {
                var xhr = err;
                err = new Error("Bad request " + xhr.status + ": " + xhr.responseText);
                err.xhr = xhr;
            }
            throw err;
        });

        return self[eventName];
    };
}



/**
 * Base class for client models
 *
 * http://backbonejs.org/#Model
 *
 * @namespace models.client
 * @class Base
 * @extends Backbone.Model
 * @see http://backbonejs.org/#Model
 */
var Base = Backbone.Model.extend({

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
     * @type Bluebird.Promise|undefined
     */

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
     * @type Bluebird.Promise|undefined
     */

    /**
     * Is the model saving or fetching data
     *
     * @method isOperating
     */
    isOperating: function() {
        return !!(this.saving || this.fetching);
    }

});

/**
 * Base class for client model collections
 *
 * http://backbonejs.org/#Collection
 *
 * @namespace models.client.Base
 * @class Collection
 * @extends Backbone.Collection
 */
Base.Collection = Backbone.Collection.extend({

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
     * @type Bluebird.Promise|undefined
     */
});

module.exports = Base;

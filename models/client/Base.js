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

        self[eventName] = Promise.delay(1000) // simulate slow network
        .then(function() {
            return Promise.cast(method.apply(self, arguments));
        })
        .then(function() {
            self[eventName] = null;
            self.trigger(eventName + ":end");
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

    fetch: promiseWrap("fetching", Backbone.Model.prototype.fetch),

    save: promiseWrap("saving", Backbone.Model.prototype.save),

    /**
     * Is the model saving or fetching data
     *
     * @method isOperating
     */
    isOperating: function() {
        return !!(this.saving || this.fetching);
    }


});

Base.Collection = Backbone.Collection.extend({
    fetch: promiseWrap("fetching", Backbone.Collection.prototype.fetch),
});

module.exports = Base;

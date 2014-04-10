"use strict";
/**
 * Implements Backbone [listenTo] for React components
 *
 * [listenTo]: http://backbonejs.org/#Events-listenTo
 *
 * @namespace utils
 * @class ListenToMixin
 */
var ListenToMixin = {

    componentWillUnmount: function() {
        this.stopListening();
    },

    /**
     * http://backbonejs.org/#Events-stopListening
     *
     * @method stopListening
     */
    stopListening: function() {
        if (!this._bbEventListeners) return;
        this._bbEventListeners.forEach(function(binding) {
            console.log("removing listen", binding.args);
            binding.emitter.off.apply(binding.emitter, binding.args);
        });
        this._bbEventListeners = null;
    },

    /**
     * http://backbonejs.org/#Events-listenTo
     *
     * @method listenTo
     */
    listenTo: function(emitter, event, callback, context) {
        this._bbEventListeners = this._bbEventListeners || [];
        context = context || this;

        var args = [event, callback, context];
        emitter.on.apply(emitter, args);
        this._bbEventListeners.push({
            emitter: emitter,
            args: args
        });
    }

};

module.exports = ListenToMixin;

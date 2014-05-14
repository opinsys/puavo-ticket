"use strict";

var _ = require("lodash");

/**
 * @namespace utils
 * @class EventMixin
 */
var EventMixin = {

    /**
     * Update component when any event is emitted from the given Backbone
     * Events object. Event handlers are automatically cleared when the
     * component is unmounted.
     *
     * @method reactTo
     * @param {Backbone.Events|Backbone.Model|Backbone.Collection} emitter
     */
    reactTo: function(emitter) {
        if (!this._emitters) this._emitters = [];
        emitter.on("all", function(e) {
            console.log("event from", e);

            // Update only when the component is mounted. An update might occur
            // for unmounted component when user navigates to an another view
            // while the data is still loading
            if (this.isMounted()) this.forceUpdate();

        }, this);

        this._emitters.push(emitter);
    },

    componentWillUnmount: function() {
        if (!this._emitters) return;
        _.invoke(this._emitters, "dispose");
        this._emitters = null;
    },

    /**
     * Create instance of a emitter which is bound to this component
     *
     * Pretty much same as:
     *
     *     var emitter = new Klass();
     *     this.reactTo(emitter);
     *
     * @method createBoundEmitter
     * @param {Function} klass Event emitter constructor function
     * @param {any} arg Argument to be passed for the constructor
     */
    createBoundEmitter: function(klass, arg) {
        // http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
        var emitter = new klass(arg);
        this.reactTo(emitter);
        return emitter;
    },

};

module.exports = EventMixin;

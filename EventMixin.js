"use strict";


/**
 * @namespace components
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
            this.forceUpdate();
        }, this);
    },

    componentWillUnmount: function() {
        var self = this;
        this._emitters.forEach(function(emitter) {
            emitter.off(null, null, self);
        });
        delete this._emitters;
    },

};

module.exports = EventMixin;

"use strict";


/**
 * EventMixin
 *
 * @namespace components
 * @class EventMixin
 */
var EventMixin = {

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

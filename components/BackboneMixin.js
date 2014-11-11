"use strict";
var Promise = require("bluebird");

function isBackboneEventEmitter(o) {
    return o && typeof o.on === "function" && typeof o.off === "function";
}

var BackboneMixin = {

    /**
     * Listen backbone models in attrs for replace events
     *
     * @private
     * @method _listenBackboneModels
     * @param {Object}
     */
    _listenBackboneModels: function(attrs) {
        var self = this;
        Object.keys(attrs).forEach(function(stateKey) {
            var newModel = attrs[stateKey];
            if (!isBackboneEventEmitter(newModel)) return;

            var currentModel = self.state[stateKey];

            newModel.once("replace", function(op) {
                Promise.resolve(op).then(function(replaceModel) {
                    if (currentModel) currentModel.off();
                    if (!self.isMounted()) return;
                    var o = {};
                    o[stateKey] = replaceModel;
                    self.setBackbone(o);
                }, self);
            });
        });
    },

    /**
     * Like React setState but listens for `replace` events on Backbone event
     * emitters. The first event argument is assumed to be a replacement event
     * emitter for the given key.
     *
     * @method setBackbone
     * @param {Object} attrs
     * @param {Function} cb
     */
    setBackbone: function(attrs, cb) {
        var self = this;
        this._listenBackboneModels(attrs);
        process.nextTick(function() {
            self.setState(attrs, cb);
        });
    },

    componentWillMount: function() {
        if (this.state) this._listenBackboneModels(this.state);
    },

    componentWillUnmount: function() {
        var self = this;
        if (!self.state) return;

        Object.keys(self.state).forEach(function(key) {
            var m = self.state[key];
            if (isBackboneEventEmitter(m)) {
                m.off(null, null, self);
            }
        });
    },
};



module.exports =  BackboneMixin;

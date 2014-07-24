"use strict";
var Promise = require("bluebird");

function isBackboneEventEmitter(o) {
    return o && typeof o.on === "function" && typeof o.off === "function";
}

var BackboneMixin = {

    /**
     * Like React setState but assumes all values to be Backbone event
     * emitters.
     *
     * Listens for `replace` events. The first event argument is assumed to be
     * a replacement event emitter for the given key.
     *
     * @method setBackbone
     * @param {Object}
     */
    setBackbone: function(attrs, cb) {
        var self = this;

        Object.keys(attrs).forEach(function(stateKey) {
            var newModel = attrs[stateKey];
            if (!isBackboneEventEmitter(newModel)) return;


            var currentModel = self.state[stateKey];
            if (currentModel) currentModel.off();

            console.log("Making", newModel.cid, "replaceable");
            newModel.once("replace", function(op) {
                console.log("replacing", newModel.cid);
                Promise.cast(op).then(function(replaceModel) {
                    var o = {};
                    o[stateKey] = replaceModel;
                    setTimeout(self.setBackbone.bind(self, o), 0);
                }, self);

            });

        });

        self.setState(attrs, cb);
    },

    componentDidMount: function() {
        if (this.state) this.setBackbone(this.state);
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

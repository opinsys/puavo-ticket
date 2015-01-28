"use strict";

var Reflux = require("reflux");

var Actions = require("../Actions");

var AjaxStore = Reflux.createStore({

    listenables: Actions.ajax,

    init: function() {
        this.state = {
            readOps: 0,
            writeOps: 0
        };
    },

    onWrite: function(promise) {
        this.state.writeOps++;
        this.emitState();
        promise
        .finally(() => this.state.writeOps--)
        .finally(this.emitState.bind(this));
    },

    onRead: function(promise) {
        this.state.readOps++;
        this.emitState();
        promise
        .finally(() => this.state.readOps--)
        .finally(this.emitState.bind(this));
    },

    getInitialState: function() {
        return this.state;
    },

    emitState: function() {
        this.trigger(this.state);
    },

});

module.exports = AjaxStore;

"use strict";

var debug = require("debug")("components/UpdateMixin");

var Nav = require("../utils/Nav");
var Base = require("../models/client/Base");

var UpdateMixin = {

    componentDidMount: function() {
        Nav.on("navigate", this.onNavigate);
        Base.on("all", this.onBackboneUpdate);
    },

    componentWillMount: function() {
        this.onNavigate();
    },

    onBackboneUpdate: function(eventName) {
        debug("force update from Backbone event: " + eventName);
        this.forceUpdate();
    },

    componentWillUnmount: function() {
        Nav.off("navigate", this.onNavigate);
        Base.off("all", this.onBackboneUpdate);
    },


};

module.exports = UpdateMixin;

"use strict";

var Backbone = require("backbone");

function captureError(customMessage) {
    return function(err) {
        Backbone.trigger("error", err, customMessage);
    };
}

module.exports = captureError;

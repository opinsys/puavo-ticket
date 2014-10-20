"use strict";

var Promise = require("bluebird");
var Backbone = require("backbone");

var captured = false;
function captureError(customMessage) {
    return function(err) {
        if (captured) return;
        captured = true;
        Backbone.trigger("error", err, customMessage);
        return new Promise(function(resolve, reject){
            // Halt the promise chain by never resolving this
        });
    };
}

module.exports = captureError;

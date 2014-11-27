"use strict";

var Promise = require("bluebird");
var Reflux = require("reflux");

/**
 * @namespace actions
 * @static
 * @class Errors
 */
var ErrorActions = {
    _captured: false,

    /**
     * @static
     * @method displayError
     * @param {Object} payload
     * @param {String} payload.message
     * @param {Error} payload.error
     */
    displayError: Reflux.createAction(),

    /**
     * Capture errors from promise chains and display the error
     *
     * @static
     * @method haltChain
     * @param {String} message
     * @return {Function}
     */
    haltChain: function(message) {
        return function(error) {
            if (ErrorActions._captured) return;
            ErrorActions._captured = true;
            ErrorActions.displayError({
                error: error,
                message: message
            });
            return new Promise(function(){
                // Halt the promise chain by never resolving this
            });
        };
    }
};

module.exports = ErrorActions;

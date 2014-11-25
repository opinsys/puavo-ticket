"use strict";

var Reflux = require("reflux");

/**
 * Refluxjs actions for the view tabs
 *
 * https://github.com/spoike/refluxjs
 *
 * @namespace actions
 * @static
 * @class ViewActions
 */
var ViewActions = Reflux.createActions([

    /**
     * Refresh views
     *
     * @static
     * @method loadViews
     */
    "loadViews",

    /**
     * @static
     * @method addView
     * @param {Object} data
     * @param {String} data.name Name of the view
     * @param {Object} data.query Query for the view
     * @param {Function} successCallback Called with the view if saving succeeded
     */
    "addView",

    /**
     * Destroy given view
     *
     * @static
     * @method destroyView
     * @param {models.client.View}
     */
    "destroyView"
]);

ViewActions.loadViews();

module.exports = {
    ViewActions: ViewActions,
};

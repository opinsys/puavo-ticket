"use strict";

var Reflux = require("reflux");
var View = require("app/models/client/View");

var ErrorActions = require("./ErrorActions");

/**
 * Refluxjs actions for the view tabs
 *
 * https://github.com/spoike/refluxjs
 *
 * @namespace actions
 * @static
 * @class ViewActions
 */
var ViewActions = {};

/**
 * Refresh views
 *
 * @static
 * @method loadViews
 * @param {Function} onSuccess
 */
ViewActions.loadViews = Reflux.createAction();
ViewActions.loadViews.listen(function(onSuccess) {
    View.collection().fetch()
    .catch(ErrorActions.haltChain("Näkymien lataaminen epäonnistui"))
    .then(ViewActions.setViews)
    .then(function() {
        if (typeof onSuccess === "function") {
            process.nextTick(onSuccess);
        }
    });
});


/**
 * @static
 * @method addView
 * @param {Object} data
 * @param {String} data.name Name of the view
 * @param {Object} data.query Query for the view
 * @param {Function} onSuccess
 */
ViewActions.addView = Reflux.createAction();
ViewActions.addView.listen(function(viewData, onSuccess) {
    var view = new View({
        name: viewData.name,
        query: viewData.query
    });

    view.save()
    .catch(ErrorActions.haltChain("Näkymän tallennus epäonnistui"))
    .then(function(view) {
        ViewActions.loadViews(onSuccess.bind(null, view));
    });

});


/**
 * @static
 * @method setViews
 * @param {models.client.TicketCollection}
 */
ViewActions.setViews = Reflux.createAction();


/**
 * Destroy given view
 *
 * @static
 * @method destroyView
 * @param {models.client.View}
 */
ViewActions.destroyView = Reflux.createAction();
ViewActions.destroyView.listen(function(view) {
    console.log("Destroying view");
    view.destroy()
    .catch(ErrorActions.haltChain("Näkymän poisto epäonnistui"))
    .then(function() {
        ViewActions.loadViews();
    });
});






module.exports = ViewActions;

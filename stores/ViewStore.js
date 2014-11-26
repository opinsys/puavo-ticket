"use strict";

var Reflux = require("reflux");

var app = require("app");
var View = require("app/models/client/View");
var ViewActions = require("app/actions/ViewActions");

/**
 * Reflux store for the ticket tabs on the front-page
 *
 * https://github.com/spoike/refluxjs
 *
 * @namespace stores
 * @static
 * @class ViewStore
 */
var ViewStore = Reflux.createStore({

    listenables: ViewActions,

    init: function() {

        this.openTickets = new View({
            name: "Avoimet",
            id: "open",
            query: {
                follower: app.currentUser.get("id"),
                tags: [
                    "status:pending|status:open",
                ]
            }
        });

        this.closedTickets = new View({
            name: "Suljetut",
            id: "closed",
            query: {
                follower: app.currentUser.get("id"),
                tags: [
                    "status:closed",
                ]
            }
        });

        this.views = View.collection();
        this.loading = false;
    },

    getInitialState: function() {
        console.log("get initial state");
        return this.getState();
    },

    getState: function() {
        return {
            loading: this.loading,
            views: [this.openTickets, this.closedTickets].concat(this.views.toArray())
        };
    },

    emitState: function() {
        this.trigger(this.getState());
    },

    getView: function(id) {
        if (id === "closed") {
            return this.closedTickets;
        } else if (id === "open") {
            return this.openTickets;
        }
        return this.views.findWhere({ id: parseInt(id, 10) });
    },

    onSetViews: function(views) {
        this.views = views;
        this.loading = false;
        this.emitState();
    },

    onLoadViews: function() {
        this.loading = true;
        this.emitState();
    },

    onAddView: function(viewData, onSuccess) {
        this.loading = true;
        this.emitState();
    },

});

module.exports = ViewStore;

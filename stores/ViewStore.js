"use strict";

var Reflux = require("reflux");

var app = require("../index");
var Actions = require("../Actions");
var View = require("../models/client/View");


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

    listenables: Actions.views,

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

    onSet: function(views) {
        this.views = views;
        this.loading = false;
        this.emitState();
    },

    onFetch: function() {
        this.loading = true;
        this.emitState();
    },

    onAdd: function(viewData, onSuccess) {
        this.loading = true;
        this.emitState();
    },

});

module.exports = ViewStore;

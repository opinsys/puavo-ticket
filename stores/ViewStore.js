"use strict";

var Reflux = require("reflux");

var app = require("app");
var captureError = require("app/utils/captureError");
var View = require("app/models/client/View");
var ViewActions = require("app/actions").ViewActions;

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

    onLoadViews: function() {
        var self = this;
        this.loading = true;
        this.emitState();

        return this.views.fetch()
        .catch(captureError("Näkymien päivitys epännistui"))
        .then(function(views) {
            self.views = views;
            self.loading = false;
            process.nextTick(self.emitState);
        });
    },

    onAddView: function(viewData, onSuccess) {
        var self = this;
        var view = new View({
            name: viewData.name,
            query: viewData.query
        });

        view.save()
        .catch(captureError("Näkymän tallennus epäonnistui"))
        .then(function(view) {
            return self.onLoadViews().return(view);
        })
        .then(onSuccess);
    },

    onDestroyView: function(view) {
        view.destroy()
        .catch(captureError("Näkymän poisto epäonnistui"))
        .then(this.onLoadViews);
    },

});

module.exports = ViewStore;

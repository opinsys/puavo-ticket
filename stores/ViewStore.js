"use strict";

var Reflux = require("reflux");
var _ = require("lodash");

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

        this.ticketCounts = {};
        this.organisationViews = [];

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


        var organisationAccessTags = _.pluck(app.currentUser.get("accessTags"), "tag")
        .filter(t => t.startsWith("organisation:"));

        this.organisationViews = organisationAccessTags.reduce((views, tag) => {
            var name = tag.replace(/^organisation:/, "");
            views.push(new View({
                name: name + " avoimet",
                id: "tagopen" + tag,
                query: {
                    tags: [
                        "status:pending|status:open",
                        tag
                    ]
                }
            }));

            views.push(new View({
                name: name + " suljetut",
                id: "tagclosed" + tag,
                query: {
                    tags: [
                        "status:closed",
                        tag
                    ]
                }
            }));

            return views;

        }, []);




        this.currentView = this.openTickets;

        this.views = View.collection();
        this.loading = false;
        this.content = [];
    },

    getInitialState: function() {
        return this.getState();
    },

    onSetCount: function(id, count) {
        this.ticketCounts[id] = count;
        this.emitState();
    },

    onClearContent: function() {
        this.content = [];
        this.emitState();
    },

    onFetchContent: function(view) {
        if (this.currentView.get("id") === view.get("id")) return;

        this.content = [];
        this.currentView = view;
        this.emitState();
    },

    onSetContent: function(content) {
        this.content = content;
        this.emitState();
    },

    getViews: function() {
        return [this.openTickets, this.closedTickets].concat(this.organisationViews).concat(this.views.toArray());
    },

    getState: function() {
        return {
            loading: this.loading,
            ticketCounts: this.ticketCounts,
            views: this.getViews(),
            content: this.content
        };
    },

    emitState: function() {
        this.trigger(this.getState());
    },

    getView: function(id) {
        return _.find(this.getViews(), (view) => String(view.get("id")) === String(id));
    },

    onSet: function(views) {
        if (!views) throw new TypeError("Cannot set falsy value as views");
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

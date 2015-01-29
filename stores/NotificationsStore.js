"use strict";

var Reflux = require("reflux");


var Actions = require("../Actions");

var NotificationsStore = Reflux.createStore({

    listenables: Actions.notifications,

    init: function() {
        this.state = {
            markingAllAsRead: 0,
            notifications: []
        };

        Actions.notifications.markAllAsRead.completed.listen(this.onMarkAllAsReadSuccess);
    },

    onMarkAllAsRead: function() {
        this.state.markingAllAsRead++;
        this.emitState();
    },

    onMarkAllAsReadSuccess: function() {
        this.state.markingAllAsRead--;
        this.emitState();
    },

    getInitialState: function() {
        return this.state;
    },

    emitState: function() {
        this.trigger(this.state);
    },


    onSet: function(notifications){
        this.state.notifications = notifications;
        this.emitState();
    },

});


module.exports = NotificationsStore;

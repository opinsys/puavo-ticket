"use strict";

var Reflux = require("reflux");
var _ = require("lodash");
var Promise = require("bluebird");

var Actions = {};

Actions.notifications = Reflux.createActions({
    fetch: {},
    set: {},
    markAllAsRead: { asyncResult: true },
});

Actions.ticket = Reflux.createActions([
    "fetch",
    "set",
    "change",
]);

Actions.views = Reflux.createActions([
    "fetch",
    "add",
    "set",
    "destroy",

    "fetchCounts",
    "setCount",

    "fetchContent",
    "clearContent",
    "setContent"
]);
Actions.views.throttledFetchCounts = _.throttle(Actions.views.fetchCounts, 10000);
Actions.views.throttledFetchContent = _.throttle(Actions.views.fetchContent, 1000);

Actions.ajax = Reflux.createActions([
    "read",
    "write",
]);


Actions.refresh = Reflux.createAction();
Actions.refresh.listen(_.throttle(function() {
    Actions.notifications.fetch();
    Actions.ticket.fetch();
    Actions.views.throttledFetchCounts();
}, 1000, {trailing: false}));



Actions.error = {display: Reflux.createAction()};
var _captured = false;
Actions.error.haltChain = function(message) {
    return function(error) {
        if (_captured) return;
        _captured = true;
        Actions.error.display({ error, message });
        // Halt the promise chain by never resolving this
        return new Promise(() => null);
    };
};


window.Actions = Actions;
module.exports = Actions;




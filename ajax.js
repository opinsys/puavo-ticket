"use strict";

var Promise = require("bluebird");

var View = require("./models/client/View");
var TicketStore = require("./stores/TicketStore");
var ViewStore = require("./stores/ViewStore");
var fetch = require("./utils/fetch");

var Actions = require("./Actions");

Actions.views.fetch.listen(function(onSuccess) {
    View.collection().fetch()
    .catch(Actions.error.haltChain("Näkymien lataaminen epäonnistui"))
    .then(Actions.views.set)
    .then(Actions.views.fetchCount)
    .then(function() {
        if (typeof onSuccess === "function") {
            process.nextTick(onSuccess);
        }
        Actions.refresh();
    });
});

Actions.views.add.listen(function(viewData, onSuccess) {
    var view = new View({
        name: viewData.name,
        query: viewData.query
    });

    Actions.ajax.write(view.save()
    .catch(Actions.error.haltChain("Näkymän tallennus epäonnistui"))
    .then(function(view) {
        Actions.views.fetch(onSuccess.bind(null, view));
    }));

});


Actions.views.destroy.listen(function(view) {
    Actions.ajax.write(view.destroy()
    .catch(Actions.error.haltChain("Näkymän poisto epäonnistui"))
    .then(Actions.views.fetch));
});

Actions.views.fetchCounts.listen(function() {
    Promise.map(ViewStore.getViews(), function(view) {
        var op = view.fetchCount();
        Actions.ajax.read(op);
        op.catch(Actions.error.haltChain("Näkymän tukipyyntöjen lukumäärän haku epäonnistui"))
        .then(function(count) {
            Actions.views.setCount(view.get("id"), count);
        });
    });
});



Actions.ticket.fetch.shouldEmit = function() {
    return !!TicketStore.state.ticket.get("id");
};

Actions.ticket.fetch.listen(function refreshTicket() {
    Actions.ajax.read(TicketStore.state.ticket.fetch()
    .catch(Actions.error.haltChain("Tukipyynnön lataus epännistui"))
    .then(Actions.ticket.set));
});


Actions.notifications.fetch.listen(function fetchNotifcations() {
    console.log("Fetching notifications");
    Actions.ajax.read(fetch({
        url: "/api/notifications"
    })
    .catch(Actions.error.haltChain("Päivitysten lataus epäonnistui"))
    .then(function(res) {
        Actions.notifications.set(res.data);
    }));
});

setImmediate(Actions.views.fetch);
setImmediate(Actions.notifications.fetch);

"use strict";

var View = require("./models/client/View");
var TicketStore = require("./stores/TicketStore");
var fetch = require("./utils/fetch");

var Actions = require("./Actions");

Actions.views.fetch.listen(function(onSuccess) {
    View.collection().fetch()
    .catch(Actions.error.haltChain("Näkymien lataaminen epäonnistui"))
    .then(Actions.views.set)
    .then(function() {
        if (typeof onSuccess === "function") {
            process.nextTick(onSuccess);
        }
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

setImmediate(Actions.notifications.fetch);

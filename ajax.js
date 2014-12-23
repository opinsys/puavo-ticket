"use strict";

var View = require("app/models/client/View");
var ErrorActions = require("app/stores/ErrorActions");
var ViewStore = require("app/stores/ViewStore");
var TicketStore = require("app/stores/TicketStore");

ViewStore.Actions.loadViews.listen(function(onSuccess) {
    View.collection().fetch()
    .catch(ErrorActions.haltChain("Näkymien lataaminen epäonnistui"))
    .then(ViewStore.Actions.setViews)
    .then(function() {
        if (typeof onSuccess === "function") {
            process.nextTick(onSuccess);
        }
    });
});

ViewStore.Actions.addView.listen(function(viewData, onSuccess) {
    var view = new View({
        name: viewData.name,
        query: viewData.query
    });

    view.save()
    .catch(ErrorActions.haltChain("Näkymän tallennus epäonnistui"))
    .then(function(view) {
        ViewStore.Actions.loadViews(onSuccess.bind(null, view));
    });

});


ViewStore.Actions.destroyView.listen(function(view) {
    view.destroy()
    .catch(ErrorActions.haltChain("Näkymän poisto epäonnistui"))
    .then(function() {
        ViewStore.Actions.loadViews();
    });
});




TicketStore.Actions.refreshTicket.shouldEmit = function() {
    return !!TicketStore.state.ticket.get("id");
};
TicketStore.Actions.refreshTicket.listen(function() {
    TicketStore.state.ticket.fetch()
    .catch(ErrorActions.haltChain("Tukipyynnön lataus epännistui"))
    .then(TicketStore.Actions.setTicket);
});

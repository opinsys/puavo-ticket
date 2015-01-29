"use strict";

var Promise = require("bluebird");

var Actions = require("../Actions");
var View = require("../models/client/View");
var ViewStore = require("../stores/ViewStore");


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


var fetchOperation = Promise.resolve();

Actions.views.fetchContent.listen(function(view) {
    if (fetchOperation.isPending()) {
        fetchOperation.cancel();
    }

    var op = view.tickets().fetch().cancellable()
    .then(function(tickets) {
        Actions.views.setContent(tickets.toArray());
    })
    .catch(Promise.CancellationError, function() {
        console.log("Ticket fetch cancelled");
    })
    .catch(Actions.error.haltChain("Tukipyyntöjen listaus epäonnistui"));

    Actions.ajax.read(op);
    fetchOperation = op;
});


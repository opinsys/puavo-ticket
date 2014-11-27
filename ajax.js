"use strict";

var View = require("app/models/client/View");
var ErrorActions = require("app/stores/ErrorActions");
var ViewStore = require("app/stores/ViewStore");

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

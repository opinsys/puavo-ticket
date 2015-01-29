"use strict";

var Actions = require("../Actions");
var fetch = require("../utils/fetch");

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

Actions.notifications.markAllAsRead.listen(function() {
    var op = fetch.post("/api/mark_all_notifications_as_read").delay(1000)
    .catch(Actions.error.haltChain("Päivitysten merkkaus luetuiksi epäonnistui"));
    Actions.ajax.write(op);
    this.promise(op);
});

Actions.notifications.markAllAsRead.completed.listen(function() {
    Actions.notifications.fetch();
});

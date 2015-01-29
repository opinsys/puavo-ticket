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

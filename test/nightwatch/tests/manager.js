"use strict";

var helpers = require("app/test/helpers");
var User = require("app/models/server/User");
var Ticket = require("app/models/server/Ticket");

module.exports = {
    beforeEach: function(browser, done) {
        helpers.clearTestDatabase()
        .then(function() {
            return User.ensureUserByUsername(
                "bruce.wayne",
                "heroes.opinsys.net"
            );
        })
        .then(function(user) {
            return Ticket.create(
                "Capture Joker",
                "That dude is evil!",
                user
            );
        })
        .then(done.bind(null))
        .catch(function(err) {
            console.error(err);
            console.error(err.stack);
            process.exit(1);
        });
    },

    "Manager can manage tickets": function (browser) {
        browser
        .puavoRestLogin("bob@hogwarts.opinsys.net", "secret")

        // Notifications about new pending tickets must appear in NotificationsHub
        .assert.containsText(".NotificationsHub-label", "Ilmoitukset 1")

        // Can navigate to the ticket
        .click(".NotificationsHub-label")
        .click(".NotificationsHub-item a")
        .waitForAjax()
        .click(".Discuss")
        .assert.containsText(
            ".Discuss-update-item .comment",
            "That dude is evil!"
        )


        .end();
    },

};

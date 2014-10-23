"use strict";

var helpers = require("app/test/helpers");

module.exports = {
    beforeEach: function(browser, done) {
        helpers.clearTestDatabase()
        .then(done.bind(null))
        .catch(function(err) {
            console.error(err);
            console.error(err.stack);
            process.exit(1);
        });
    },

    "Login test": function (browser) {
        browser
        .puavoRestLogin("clark.kent@heroes.opinsys.net", "secret")

        .click(".Main-new-ticket")
        .setValue(".TicketForm-title", "Test ticket title")
        .setValue(".TicketForm-description", "A description for ticket")
        .click(".TicketForm-save-ticket")
        .waitForElementVisible(".Discuss .ticket-pending", 5000)
        .assert.containsText(".Discuss .ticket-pending", "Odottava")

        .setValue(".CommentForm-input", "A comment")
        .click(".CommentForm-save-comment")
        .waitForAjax()
        .assert.containsText(
            ".Discuss-update-item:last-of-type .comment",
            "A comment"
        )
        .end();
    },

};

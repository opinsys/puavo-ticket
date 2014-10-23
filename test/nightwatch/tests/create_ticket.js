"use strict";

var helpers = require("app/test/helpers");

module.exports = {
    beforeEach: function(browser, done) {
        helpers.clearTestDatabase()
        .then(done.bind(null))
        .catch(done);
    },

    "Login test": function (browser) {
        browser
        .puavoRestLogin("bruce.wayne@heroes.opinsys.net", "secret")

        .click(".Main-new-ticket")
        .setValue(".TicketForm-title", "Test ticket title")
        .setValue(".TicketForm-description", "A description for ticket")
        .click(".TicketForm-save-ticket")
        .waitForElementVisible(".Discuss .ticket-pending", 5000)
        .assert.containsText(".Discuss .ticket-pending", "Odottava")

        .setValue(".CommentForm-input", "A comment")
        .click(".CommentForm-save-comment")
        .waitForElementNotVisible(".Loading,.fa-spin", 5000)
        .assert.containsText(".Discuss-update-item:last-of-type .comment", "A comment")
        .end();
    },

};

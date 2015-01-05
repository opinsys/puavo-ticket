"use strict";

var wd = require("wd");
var asserters = wd.asserters;

var aHelpers = require("./helpers");
var helpers = require("app/test/helpers");
var browser = aHelpers.browser;

var User = require("app/models/server/User");
var Ticket = require("app/models/server/Ticket");

describe("Ticket title", function() {

    before(function() {
        var self = this;
        return helpers.clearTestDatabase()
         .then(function() {
            return User.ensureUserByUsername(
                "bruce.wayne",
                "heroes.opinsys.net"
            );
        })
        .then(function(user) {
            return Ticket.create(
                "Capture penguin",
                "I think his up to something",
                user
            );
        })
        .then(function(ticket) {
            self.ticket = ticket;
            return browser.init({ browserName: aHelpers.browserName });
        });
    });

    after(function() {
        return browser.quit();
    });

    it("can be edited", function() {
        var self = this;
        return browser.get(aHelpers.url + "/tickets/" + self.ticket.get("id"))
        .then(function() {
            return aHelpers.login("bruce.wayne@heroes.opinsys.net", "secret");
        })
        .then(function() {
            return browser
            .waitForElementByCss(".EditableText-start-button", 1000*10)
            .click()
            .elementByCss(".EditableText-input").type(" EDIT")
            .elementByCss(".EditableText-save-button").click()
            .waitForElementByCss(".Discuss-title", asserters.textInclude("Capture penguin EDIT"), 1000*10)
            ;
        });
    });
});

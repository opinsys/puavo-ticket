"use strict";

var assert = require("assert");

var aHelpers = require("./helpers");
var helpers = require("app/test/helpers");
var browser = aHelpers.browser;

var User = require("app/models/server/User");
var Ticket = require("app/models/server/Ticket");

describe("View tabs", function() {

    before(function() {
        return helpers.clearTestDatabase()
         .then(function() {
            return User.ensureUserByUsername(
                "bob",
                "hogwarts.opinsys.net"
            );
        })
        .then(function(user) {
            return Ticket.create(
                "This ticket is open",
                "an open ticket",
                user
            )
            .then(function() {
                return Ticket.create(
                    "This ticket is closed",
                    "a closed ticket",
                    user
                ).then(t => t.setStatus("closed", user));
            })
            .then(function() {
                return Ticket.create(
                    "Ticket has custom tag",
                    "Ticket with custom tag",
                    user
                ).then(t => t.addTag("foo", user));
            });

        })
        .then(function() {
            return browser.init({ browserName: aHelpers.browserName });
        })
        .then(function() {
            return browser.get(aHelpers.url);
        })
        .then(function() {
            return aHelpers.login("bob@hogwarts.opinsys.net", "secret");
        });
    });

    after(function() {
        return browser.quit();
    });

    it("has the open ticket on the default tab", function() {
        return browser.waitForElementByCss(
            ".TicketList-ticket-title",
            aHelpers.safeTextInclude("This ticket is open")
        )
        .elementsByCss(".TicketList-ticket-title")
        .then(function(elements) {
            assert.equal(2, elements.length, "should only have 2 tickets");
        });
    });

    it("has closed tickets on the closed tab", function() {
        return browser
        .waitForElementByCss(".ViewTabs a", aHelpers.safeTextInclude("Suljetut")).click()
        .waitForElementByCss(
            ".TicketList-ticket-title",
            aHelpers.safeTextInclude("This ticket is closed")
        )
        .elementsByCss(".TicketList-ticket-title")
        .then(function(elements) {
            assert.equal(1, elements.length, "should only have 1 closed ticket");
        });

    });

    it("can use the edit tab", function() {
        return browser.elementByCss(".ViewTabs-new-tab-button").click()
        .waitForElementByCss(".ViewEditor-name-input").type("Foo-tab")
        .elementByCss(".ViewEditor-query-input")

        // XXX: wtf the value gets set back to the original
        .clear().delay(2000).clear()

        .type("tags=foo")
        ;
    });

    it("edit preview shows results", function() {
        return browser.elementByCss(".ViewEditor-preview-button").click()
        .waitForElementByCss(
            ".ViewEditor-preview .TicketList-ticket-title",
            aHelpers.safeTextInclude("Ticket has custom tag"),
            1000*5
        )
        .elementsByCss(".ViewEditor-preview .TicketList-ticket-title")
        .then(function(elements) {
            assert.equal(1, elements.length, "should have only one result");
        });
    });



    it("can save new view", function() {
        return browser.elementByCss(".ViewEditor-save-button").click()
        .waitForElementByCss(".ViewTabs a", aHelpers.safeTextInclude("Foo-tab"))
        .waitForElementByCss(
            ".TicketList-ticket-title",
            aHelpers.safeTextInclude("Ticket has custom tag")
        )
        .elementsByCss(".TicketList-ticket-title")
        .then(function(elements) {
            assert.equal(1, elements.length, "should have only one result");
        })
        ;
    });

    it("can load custom tab on app load", function() {
        return browser.refresh()
        .waitForElementByCss(
            ".TicketList-ticket-title",
            aHelpers.safeTextInclude("Ticket has custom tag")
        )
        .elementsByCss(".TicketList-ticket-title")
        .then(function(elements) {
            assert.equal(1, elements.length, "should have only one result");
        });
    });

});

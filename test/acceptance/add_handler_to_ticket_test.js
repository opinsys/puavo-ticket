"use strict";

var assert = require("assert");
var wd = require("wd");
var asserters = wd.asserters;


var aHelpers = require("./helpers");
var helpers = require("app/test/helpers");
var browser = aHelpers.browser;

var User = require("app/models/server/User");
var Ticket = require("app/models/server/Ticket");

describe("ticket handlers", function() {

    before(function() {
        return helpers.clearTestDatabase()
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


    it("has notification about new ticket", function() {
        return browser
        .elementByCss(".NotificationsHub-label").text()
        .then(function(val) {
            assert.equal("Ilmoitukset 1", val);
        });
    });

    it("can navigate to the ticket via the notification", function() {
        return browser
        .elementByCss(".NotificationsHub-label").click()
        .elementByCss(".NotificationsHub-item a").click()
        .waitForElementByCss(".Discuss .ticket-title").text()
        .then(function(val) {
            assert.equal("Capture Joker", val);
        });
    });

    it("sees pending ticket status", function() {
        return browser
        .elementByCss(".Discuss-status").text()
        .then(function(val) {
            assert.equal("Odottava #1", val);
        });
    });

    it("can navigate to handlers tab", function() {
        return browser
        .elementByCss(".TicketView-tab-handlers").click()
        .waitForElementByCss(".SelectUsers-search-input", asserters.isDisplayed);
    });

    it("can search alice", function() {
        return browser
        .elementByCss(".SelectUsers-search-input").type("alice")
        .waitForElementByCss(".SelectUsers-search-results .UserItem .name").text()
        .then(function(val) {
            assert.equal("Brown, Alice", val);
        });
    });

    it("can add alice as a handler", function(){
        return browser
        .waitForElementByCss(".SelectUsers-search-results .UserItem .name").click()
        .waitForElementByCss(".EditableList .Item", asserters.textInclude("Brown, Alice"))
        ;

    });

    it("ticket status is set to open after adding a manager handler", function() {
        return browser
        .elementByCss(".TicketView-tab-discuss").click()
        .elementByCss(".Discuss-status").text()
        .then(function(val) {
            assert.equal("Avoin #1", val);
        });
    });

    it("can comment a ticket", function() {
        return browser
        .elementByCss(".CommentForm-input").type("A comment by bob")
        .elementByCss(".CommentForm-save-comment").click()
        .waitForElementByCss(".CommentUpdate .content", asserters.textInclude("A comment by bob"))
        ;
    });

    it("can close the ticket", function() {
        return browser
        .elementByCss(".ToggleStatusButton").click()
        .waitForElementsByCss(".Discuss-status", asserters.textInclude("Ratkaistu"))
        .elementByCss(".ToggleStatusButton").text()
        .then(function(val) {
            assert.equal("Avaa uudelleen", val);
        })
        ;
    });

});

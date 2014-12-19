"use strict";

var assert = require("assert");


var aHelpers = require("./helpers");
var helpers = require("app/test/helpers");
var browser = aHelpers.browser;

var User = require("app/models/server/User");
var Ticket = require("app/models/server/Ticket");

describe("Hidden comments", function() {

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

    it("manager can create one", function() {
        var self = this;
        return browser.get(aHelpers.url + "/tickets/" + self.ticket.get("id"))
        .then(function() {
            return aHelpers.login("bob@hogwarts.opinsys.net", "secret");
        })
        .then(function() {
            return browser
            .waitForElementByCss(".CommentForm-input")
            .elementByCss(".CommentForm-input").type("that dude is lame")
            .elementByCss(".CommentForm .ToggleHiddenButton").click()
            .elementByCss(".CommentForm-save-comment").click();
        });
    });

    it("has special class", function() {
        return browser
        .waitForElementByCss(".CommentUpdate.hidden-comment").text()
        .elementByCss(".CommentUpdate.hidden-comment .comment").text()
        .then(function(val) {
            assert.equal("that dude is lame", val);
        });
    });

    it("are not seen by normal users", function() {
        var self = this;
        return aHelpers.logout()
        .get(aHelpers.url + "/tickets/" + self.ticket.get("id"))
        .then(function() {
            return aHelpers.login("bruce.wayne@heroes.opinsys.net", "secret");
        })
        .waitForElementByCss(".CommentUpdate")
        .elementByCssSelectorOrNull(".CommentUpdate.hidden-comment")
        .then(function(el) {
            assert(!el, "the element should not be present");
        })
        .elementsByCss(".CommentUpdate .comment").last().text()
        .then(function(val) {
            assert.notEqual("that dude is lame", val);
        });
    });

});

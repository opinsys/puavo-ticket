"use strict";

var assert = require("assert");
var Promise = require("bluebird");


var aHelpers = require("./helpers");
var helpers = require("app/test/helpers");
var browser = aHelpers.browser;

var User = require("app/models/server/User");
var Ticket = require("app/models/server/Ticket");

describe("NotificationsHub", function() {
    var user, handler, ticket;

    before(function() {
        return helpers.clearTestDatabase()
        .then(() => Promise.join(
            User.ensureUserByUsername(
                "bruce.wayne",
                "heroes.opinsys.net"
            ).then(u => user = u),
            User.ensureUserByUsername(
                "han.solo",
                "heroes.opinsys.net"
            ).then(u => handler = u)
        ))
        .then(() => {
            return Ticket.create(
                "Capture Joker",
                "That dude is evil!",
                user
            )
            .tap(t => ticket = t)
            .then(function(ticket) {
                return ticket.addHandler(handler, handler);
            });
        })
        .then(() => browser.init({ browserName: aHelpers.browserName }))
        .then(() => browser.get(aHelpers.url))
        .then(() => aHelpers.login(handler.getDomainUsername(), "secret"));
    });

    after(() => browser.quit());


    it("has notification about handled ticket", function() {
        return browser
        .elementByCss(".NotificationsHub-label").text()
        .then(function(val) {
            assert.equal("Ilmoitukset 1", val);
        });
    });

    it("notification count is in title", function() {
        return browser.title().then(function(val) {
            assert.equal("(1) Opinsys tukipalvelu", val);
        });
    });

    it("can navigate to the ticket via the notification", function() {
        return browser
        .elementByCss(".NotificationsHub-label").click()
        .delay(1000)
        .elementByCss(".NotificationsHub-item a").click()
        .waitForElementByCss(".Discuss-title").text()
        .then(function(val) {
            assert.equal("#1 Capture Joker", val);
        });
    });

});

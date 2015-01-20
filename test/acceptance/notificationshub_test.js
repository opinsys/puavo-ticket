"use strict";

var assert = require("assert");
var Promise = require("bluebird");


var aHelpers = require("./helpers");
var helpers = require("app/test/helpers");
var browser = aHelpers.browser;

var User = require("app/models/server/User");
var Ticket = require("app/models/server/Ticket");

describe("ticket handlers", function() {

    before(function() {
        var self = this;
        return helpers.clearTestDatabase()
         .then(function() {
             return Promise.join(
                User.ensureUserByUsername(
                    "bruce.wayne",
                    "heroes.opinsys.net"
                 ),
                User.ensureUserByUsername(
                    "bob",
                    "hogwarts.opinsys.net"
                 )
             );
        })
        .spread(function(user, manager) {
            return Ticket.create(
                "Capture Joker",
                "That dude is evil!",
                user
            )
            .then(function(ticket) {
                return ticket.addHandler(manager, manager);
            });
        })
        .then(function(ticket) {
            self.ticket = ticket;
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

    it("notification count is in title", function() {
        return browser.title().then(function(val) {
            assert.equal("(1) Opinsys tukipalvelu", val);
        });
    });

    it("can navigate to the ticket via the notification", function() {
        return browser
        .elementByCss(".NotificationsHub-label").click()
        .elementByCss(".NotificationsHub-item a").click()
        .waitForElementByCss(".Discuss-title").text()
        .then(function(val) {
            assert.equal("#1 Capture Joker", val);
        });
    });

});

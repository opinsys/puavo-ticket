"use strict";

var aHelpers = require("./helpers");
var assert = require("assert");

var helpers = require("app/test/helpers");
var browser = aHelpers.browser;

describe("Create ticket", function() {

    before(function() {
        return helpers.clearTestDatabase()
        .then(function initBrowser() {
            return browser.init({ browserName: aHelpers.browserName });
        });
    });

    after(function() {
        return browser.quit();
    });

    it("can login", function() {
        return browser.get(aHelpers.url)
        .then(function() {
            return aHelpers.login("bob@hogwarts.opinsys.net", "secret");
        });
    });

    it("can navigate to ticket creation page", function() {
       return browser.elementByCss(".Main-new-ticket").click();
    });

    it("can submit a ticket", function() {
        return browser
        .elementByCss(".TicketForm-title").type("Test ticket title")
        .elementByCss(".TicketForm-description").type("A description for ticket")
        .uploadFile(__dirname + "/hello.txt")
        .then(function(path) {
            return browser
            // Cannot type on hidden elements. Force file input as visible
            .execute('document.getElementsByClassName("AttachmentsForm-form")[0].style.display = "block";')
            .elementByCss(".AttachmentsForm-file-input").type(path);
        })
        .elementByCss(".TicketForm-save-ticket").click()

        .waitForElementByCss(".Discuss-update-item .comment", 1000*10).text()
        .then(function(val) {
            assert.equal("A description for ticket", val);
        })

        .elementByCss(".CommentUpdate .FileItem-name").text()
        .then(function(val) {
            assert.equal("hello.txt", val);
        })

        ;
    });

});

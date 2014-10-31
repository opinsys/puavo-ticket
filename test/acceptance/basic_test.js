"use strict";
process.env.NODE_ENV = "acceptance";

var assert = require("assert");
var wd = require("wd");

var helpers = require("app/test/helpers");
var config = require("app/config");

var browser = wd.promiseChainRemote();

var url = "http://" + config.domain + ":" + config.port;

process.on("exit", function() {
    browser.quit();
});

describe("basic", function() {

    before(function() {
        return helpers.clearTestDatabase()
        .then(function() {
            return browser.init({ browserName: "firefox" });
        });
    });

    after(function() {
        return browser.quit();
    });

    it("can login", function() {
        return browser.get(url)
        .elementByCss("input[name=username]").type("bob@hogwarts.opinsys.net")
        .elementByCss("input[name=password]").type("secret")
        .elementByCss("input[type=submit]").click()
        .waitForElementByCss(".Main")
        ;
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

        .waitForElementByCss(".Discuss-update-item .comment").text()
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

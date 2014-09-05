"use strict";

var assert = require("assert");
var sinon = require("sinon");

var BrowserTitle = require("app/utils/BrowserTitle");

describe("BrowserTitle", function() {

    it("can change the document title", function() {
        var doc = {};
        var bt = new BrowserTitle({ document: doc });
        bt.setTitle("foo");
        bt.activateNow();

        assert.equal("foo", doc.title);
    });

    it("can change the document title with trailing title", function() {
        var doc = {};
        var bt = new BrowserTitle({ document: doc, trailingTitle: "bar" });
        bt.setTitle("foo");
        bt.activateNow();

        assert.equal("foo - bar", doc.title);
    });

    it("works without a main title", function() {
        var doc = {};
        var bt = new BrowserTitle({ document: doc, trailingTitle: "bar" });
        bt.setTitle("");
        bt.activateNow();

        assert.equal("bar", doc.title);
    });

    it("can set notication count", function() {
        var doc = {};
        var bt = new BrowserTitle({ document: doc, trailingTitle: "bar" });
        bt.setTitle("foo");
        bt.setNotificationCount(1);
        bt.activateNow();

        assert.equal("(1) foo - bar", doc.title);
    });

    it("does not display zero notification count", function() {
        var doc = {};
        var bt = new BrowserTitle({ document: doc, trailingTitle: "bar" });
        bt.setTitle("foo");
        bt.setNotificationCount(0);
        bt.activateNow();

        assert.equal("foo - bar", doc.title);
    });

    it("can activate only after next tick", function(done) {
        var doc = {};
        var bt = new BrowserTitle({ document: doc, trailingTitle: "bar" });

        sinon.spy(bt, "activateNow");

        bt.setTitle("first");
        bt.activateOnNextTick();
        bt.setTitle("second");
        bt.activateOnNextTick();

        assert(!doc.title, "title is not set on this tick");

        setTimeout(function() {
            assert.equal("second - bar", doc.title);
            assert.equal(1, bt.activateNow.callCount);
            done();
        }, 10);
    });

});


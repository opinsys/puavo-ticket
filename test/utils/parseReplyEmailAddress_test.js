"use strict";
var assert = require("assert");

var parseReplyEmailAddress = require("app/utils/parseReplyEmailAddress");

describe("utils/parseReplyEmailAddress", function() {

    it("tukipyynto1+secret@tuki.opinsys.net", function() {
        var ob = parseReplyEmailAddress("tukipyynto1+secret@tuki.opinsys.net");
        assert(ob);
        assert.equal(1, ob.ticketId);
        assert.equal("secret", ob.emailSecret);
        assert.equal("tuki.opinsys.net", ob.domain);
    });

    it("staging-tukipyynto1+secret@tuki.opinsys.net", function() {
        var ob = parseReplyEmailAddress("staging-tukipyynto1+secret@tuki.opinsys.net");
        assert(ob);
        assert.equal(1, ob.ticketId);
        assert.equal("secret", ob.emailSecret);
        assert.equal("tuki.opinsys.net", ob.domain);
    });

});

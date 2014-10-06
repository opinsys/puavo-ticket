"use strict";
var assert = require("assert");

var parseReplyEmailAddress = require("app/utils/parseReplyEmailAddress");

describe("utils/parseReplyEmailAddress", function() {

    it("reply-to-1+secret@tuki.opinsys.net", function() {
        var ob = parseReplyEmailAddress("reply-to-1+secret@tuki.opinsys.net");
        assert(ob);
        assert.equal(1, ob.ticketId);
        assert.equal("secret", ob.emailSecret);
        assert.equal("tuki.opinsys.net", ob.domain);
    });

    it("staging-reply-to-1+secret@tuki.opinsys.net", function() {
        var ob = parseReplyEmailAddress("staging-reply-to-1+secret@tuki.opinsys.net");
        assert(ob);
        assert.equal(1, ob.ticketId);
        assert.equal("secret", ob.emailSecret);
        assert.equal("tuki.opinsys.net", ob.domain);
    });

    it("staging-tukipyynto@tuki.opinsys.fi is not a reply adress", function() {
        assert(!parseReplyEmailAddress("staging-tukipyynto@tuki.opinsys.fi"));
    });

});

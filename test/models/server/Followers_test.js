"use strict";

var helpers = require("../../helpers");

var Follower = require("../../../models/server/Follower");
var assert = require("assert");

describe("Follower model", function() {

    before(function() {
        return helpers.clearTestDatabase();
    });

    it("Instance can be created", function() {
        return Follower.forge({
                ticket: 1,
                user: 1
            })
            .save()
            .then(function(follower) {
                return Follower.forge({ id: follower.get("id") }).fetch();
            })
            .then(function(follower) {
                assert.equal(1, follower.get("user"));
                assert.equal(1, follower.get("ticket"));
            });


    });
});

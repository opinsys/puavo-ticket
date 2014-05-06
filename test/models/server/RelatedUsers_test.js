"use strict";

var helpers = require("../../helpers");

var RelatedUser = require("../../../models/server/RelatedUser");
var assert = require("assert");

describe("RelatedUser model", function() {

    before(function() {
        return helpers.clearTestDatabase();
    });

    it("Instance can be created", function() {
        return RelatedUser.forge({
            ticket: 1,
            external_id: 1,
            username: "testuser"
            })
            .save()
            .then(function(user) {
                return RelatedUser.forge({ id: user.get("id") }).fetch();
            })
            .then(function(user) {
                assert.equal("testuser", user.get("username"));
            });


    });
});

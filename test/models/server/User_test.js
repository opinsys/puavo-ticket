"use strict";

var helpers = require("../../helpers");

var User = require("../../../models/server/User");
var assert = require("assert");

describe("User mode", function() {

    before(function() {
        return helpers.clearTestDatabase();
    });

    it("Instance ca be created", function() {
        return User.forge({
            user_id: 1,
            username: "testuser",
            email: "joe.bloggs@testdomain.com",
            first_name: "Joe",
            last_name: "Bloggs",
            organisation_domain: "test.testdomain.com"
            })
            .save()
            .then(function(user) {
                return User.forge({ id: user.get("id") }).fetch();
            })
            .then(function(user) {
                assert.equal("testuser", user.get("username"));
                assert.equal("joe.bloggs@testdomain.com", user.get("email"));
                assert.equal("Joe", user.get("first_name"));
                assert.equal("Bloggs", user.get("last_name"));
                assert.equal("test.testdomain.com", user.get("organisation_domain"));
            });

    });
});

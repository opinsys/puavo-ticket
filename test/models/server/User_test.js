"use strict";

var helpers = require("../../helpers");

var User = require("../../../models/server/User");
var assert = require("assert");

describe("User model", function() {
    before(function() {
        return helpers.clearTestDatabase();
    });

    it("Instance ca be created", function() {
        return User.forge({
                external_id: 1,
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

describe("UserMixin", function() {
    before(function() {
        this.user = new User(helpers.user.teacher);
    });

    it("has user visibility", function() {
        assert(this.user.getVisibilities().indexOf("user:9324") !== -1);
    });

    it("has organisation visibility", function() {
        assert(this.user.getVisibilities().indexOf("organisation:testing.opinsys.fi") !== -1);
    });

    // XXX: restore after schools are added back to db
    // it("has school visibility", function() {
    //     assert(this.user.getVisibilities().indexOf("school:234") !== -1);
    // });

});

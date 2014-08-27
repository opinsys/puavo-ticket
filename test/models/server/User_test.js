"use strict";

var assert = require("assert");

var helpers = require("app/test/helpers");
var User = require("app/models/server/User");

describe("User model", function() {
    before(function() {
        return helpers.clearTestDatabase();
    });

    it("can be instantiated", function() {
        var testUser = {
            username: "testuser",
            email: "joe.bloggs@testdomain.com",
            first_name: "Joe",
            last_name: "Bloggs",
            organisation_domain: "test.testdomain.com"
        };

        return User.forge({
                externalId: 1,
                externalData: testUser
            })
            .save()
            .then(function(user) {
                return User.forge({ id: user.get("id") }).fetch();
            })
            .then(function(user) {
                assert.equal("testuser", user.get("externalData").username);
                assert.equal("joe.bloggs@testdomain.com", user.get("externalData").email);
                assert.equal("Joe", user.get("externalData").first_name);
                assert.equal("Bloggs", user.get("externalData").last_name);
                assert.equal("test.testdomain.com", user.get("externalData").organisation_domain);
            });
    });

});

describe("UserMixin", function() {
    before(function() {
        this.user = new User({
            id: 1,
            externalId: helpers.user.teacher.id,
            externalData: helpers.user.teacher
        });
    });

    it("has user visibility", function() {
        //
        // Use now externalId but should be use id from users table
        //
        //assert(this.user.getVisibilities().indexOf("user:9324") !== -1);
    });

    it("has organisation visibility", function() {
        assert(this.user.getVisibilities().indexOf("organisation:testing.opinsys.fi") !== -1);
    });

    // XXX: restore after schools are added back to db
    // it("has school visibility", function() {
    //     assert(this.user.getVisibilities().indexOf("school:234") !== -1);
    // });

});

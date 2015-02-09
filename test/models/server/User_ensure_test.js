"use strict";

var assert = require("assert");

var helpers = require("app/test/helpers");
var User = require("app/models/server/User");
var nock = require("nock");

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

    it("can be initiated by email address", function() {
        var email = "joe.bloggs@foobar.com";
        var first_name = "Joe";
        var last_name  = "Bloggs";

        return User.ensureUserByEmail(email, first_name, last_name)
            .then(function(user) {
                return User.byEmailAddress(email).fetch();
            })
            .then(function(user) {
                assert.equal("Joe", user.get("externalData").first_name);
                assert.equal("Bloggs", user.get("externalData").last_name);
                assert.equal("joe.bloggs@foobar.com", user.get("externalData").email);
            });
    });

    describe("ensure that user from a Puavo JWT token Object exists when external id", function() {
        var token = {
            "id": "9335",
            "username": "jane.doe",
            "first_name": "Jane",
            "last_name": "Doe",
            "organisation_domain": "testing.opinsys.fi",
            "email": "jane.doe@example.com"
        };

        it("not found", function() {

            return helpers.clearTestDatabase()
                .then(function() {
                    return User.ensureUserFromJWTToken(token);
                })
                .then(function(user) {
                    return User.forge({ externalId: token.id}).fetch();
                })
                .then(function(user) {
                    assert.equal("Jane", user.get("externalData").first_name);
                    assert.equal("Doe", user.get("externalData").last_name);
                });
        });

        it("not found but email address is alredy set with other external id", function() {
            var self = this;
            token.id = "998833";

            nock("https://test-api.opinsys.example")
                .matchHeader("Host", "testing.opinsys.fi")
                .get("/v3/users/jane.doe")
                .reply(200, "null");

            return User.forge({ externalId: "9335" }).fetch()
                .then(function(user) {
                    self.existsUser = user;
                    return User.ensureUserFromJWTToken(token);
                })
                .then(function(user) {
                    return User.forge({ externalId: token.id}).fetch();
                })
                .then(function(user) {
                    assert.equal(self.existsUser.id, user.id);
                    assert.equal("Jane", user.get("externalData").first_name);
                    assert.equal("Doe", user.get("externalData").last_name);
                });
        });

        it("not found but email address is alredy set with other external id and user is active on the Puavo", function() {
            var self = this;
            token.id = "998844";

            nock("https://test-api.opinsys.example")
                .matchHeader("Host", "testing.opinsys.fi")
                .get("/v3/users/jane.doe")
                .reply(200, [{ username: "jane.doe",
                               id: "998833",
                               email: "jane.doe@example.com" }]);

            return User.forge({ externalId: "998833"}).fetch()
                .then(function(user) {
                    self.existsUser = user;
                    return User.ensureUserFromJWTToken(token).catch(User.EmailCollisionError, function(err) {
                        return true;
                    });
                })
                .then(function(result) {
                    assert.equal(result instanceof User, false, "could not get throws when email is already reserved");
                });
        });
    });
});

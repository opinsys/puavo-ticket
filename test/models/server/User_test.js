"use strict";

var assert = require("assert");
var sinon = require("sinon");

var helpers = require("app/test/helpers");
var User = require("app/models/server/User");

var testUserData = {
    username: "joe",
    email: "joe.bloggs@testdomain.com",
    first_name: "Joe",
    last_name: "Bloggs",
    organisation_domain: "test.testdomain.com"
};


describe("User model", () => {

    before(() => helpers.clearTestDatabase());

    describe("created manually", () => {
        var user;

        before(() => User.forge({
            externalId: "123",
            externalData: testUserData
        }).save().then(u => user = u));

        it("gets an id", () => {
            assert(user.get("id"));
        });

        it("has getExternalId()", () => {
            assert.equal("123", user.getExternalId());
        });

        it("has getFullName()", () => {
            assert.equal("Joe Bloggs", user.getFullName());
        });

        it("has getUsername()", () => {
            assert.equal("joe", user.getUsername());
        });

        it("has getEmail()", () => {
            assert.equal("joe.bloggs@testdomain.com", user.getEmail());
        });

        it("has getAlphabeticName()", () => {
            assert.equal("Bloggs, Joe", user.getAlphabeticName());
        });

        it("has getOrganisationDomain()", () => {
            assert.equal("test.testdomain.com", user.getOrganisationDomain());
        });

        it("has getProfileImage()", () => {
            assert.equal("/api/puavo/test.testdomain.com/v3/users/joe/profile.jpg", user.getProfileImage());
        });

        it("has access tag", () => {
            return user.accessTags()
            .query({ where: { tag: "user:" + user.get("id") }})
            .fetch()
            .then(tags => {
                assert.equal(1, tags.size());
                assert.equal("user:1", tags.first().get("tag"));
            });
        });

        describe("is updated", () => {
            var spy;
            before(() => {
                spy = sinon.spy(user, "addAccessTag");
                return user.set({updatedAt: new Date()}).save();
            });

            it("access tags get ensured", () => {
                assert(spy.called);
            });

        });

    });

    describe("created using email only", () => {
        var user;
        before(() => User.ensureUserByEmail(
            "foo@bar.com", "foo", "bar"
        ).then(u => user = u));

        it("gets an id", () => {
            assert(user.get("id"));
        });

        it("has getEmail()", () => {
            assert.equal("foo@bar.com", user.getEmail());
        });

        it("can be found using User.byEmailAddress(email)", () => {
            return User.byEmailAddress("foo@bar.com").fetch({require:true})
            .then( u => {
                assert(u);
                assert.equal(user.get("id"), u.get("id"));
            });
        });

    });

});

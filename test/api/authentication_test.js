"use strict";
var _ = require("lodash");
var assert = require("assert");
var helpers = require("../helpers");

describe("Authentication", function() {


    it("can get user information after authentication", function() {

        return helpers.clearTestDatabase()
            .then(function() {
                return helpers.loginAsUser(helpers.user.teacher);
            })
            .then(function() {
                return helpers.fetchTestUser();
            })
            .then(function(user) {
                assert.equal(user.get("username"), "olli.opettaja");
                assert.equal(user.get("email"), "olli.opettaja@testing.opinsys.fi");
		assert.deepEqual(user.get("external_data"), helpers.user.teacher);
            });
    });

    it("can get user updated information after authentication", function() {
        var updatedUser = _.cloneDeep(helpers.user.teacher);
        updatedUser.username = "change.olli.opettaja";
        updatedUser.email = "change.olli.opettaja@testing.opinsys.fi";
        updatedUser.first_name = "changeOlli";
        updatedUser.last_name = "changeOpettaja";

        return helpers.loginAsUser(updatedUser)
            .then(function() {
                return helpers.fetchTestUser();
            })
            .then(function(user) {
                assert.equal(user.get("username"), "change.olli.opettaja");
                assert.equal(user.get("email"), "change.olli.opettaja@testing.opinsys.fi");
                assert.equal(user.get("first_name"), "changeOlli");
                assert.equal(user.get("last_name"), "changeOpettaja");
		assert.deepEqual(user.get("external_data"), updatedUser);
            });
    });
});

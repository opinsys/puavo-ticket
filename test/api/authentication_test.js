"use strict";
var _ = require("lodash");
var assert = require("assert");

var helpers = require("app/test/helpers");

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
                assert.equal(user.get("externalId"), "9324");
                assert.deepEqual(user.get("externalData"), helpers.user.teacher);
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
                assert.deepEqual(user.get("externalData"), updatedUser);
            });
    });
});

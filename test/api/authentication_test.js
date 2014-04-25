"use strict";
var assert = require("assert");
var helpers = require("../helpers");

var User = require("../../models/server/User");

describe("Authentication", function() {


    it("can get user information after authentication", function() {

        return helpers.clearTestDatabase()
            .then(function() {
                return helpers.loginAsUser(helpers.user.teacher);
            })
            .then(function() {
                return User.forge({ id: 1 }).fetch()
                    .then(function(user) {
                        assert.equal(user.get("username"), "olli.opettaja");
                        assert.equal(user.get("email"), "olli.opettaja@testing.opinsys.fi");
                    });
            });
    });

    it("can get user updated information after authentication", function() {
        helpers.user.teacher.username = "change.olli.opettaja";
        helpers.user.teacher.email = "change.olli.opettaja@testing.opinsys.fi";
        helpers.user.teacher.first_name = "changeOlli";
        helpers.user.teacher.last_name = "changeOpettaja";

        return helpers.loginAsUser(helpers.user.teacher)
            .then(function() {
                return User.forge({ id: 1 }).fetch()
                    .then(function(user) {
                        assert.equal(user.get("username"), "change.olli.opettaja");
                        assert.equal(user.get("email"), "change.olli.opettaja@testing.opinsys.fi");
                        assert.equal(user.get("first_name"), "changeOlli");
                        assert.equal(user.get("last_name"), "changeOpettaja");
                    });
            });
    });
});

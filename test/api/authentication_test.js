"use strict";
var assert = require("assert");
var helpers = require("../helpers");

var User = require("../../models/server/User");

describe("Authentication", function() {

    before(function() {
        var self = this;

        return helpers.clearTestDatabase()
            .then(function() {
                return helpers.loginAsUser(helpers.user.teacher);
            })
            .then(function(agent) {
                self.agent = agent;
            });
    });

    after(function() {
        return this.agent.logout();
    });

    it("can get user information after authentication", function() {
        return User.forge({ id: 1 }).fetch()
            .then(function(user) {
                assert.equal(user.get("username"), "olli.opettaja");
            });
    });
});

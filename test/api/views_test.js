"use strict";

var Promise = require("bluebird");
var assert = require("assert");

var helpers = require("app/test/helpers");
var User = require("app/models/server/User");

describe("/api/views", function() {

    before(function() {
        var self = this;
        return helpers.clearTestDatabase()
            .then(function() {
                return Promise.join(
                    User.ensureUserFromJWTToken(helpers.user.manager),
                    User.ensureUserFromJWTToken(helpers.user.teacher),
                    User.ensureUserFromJWTToken(helpers.user.teacher2)
                );
            })
            .spread(function(manager, teacher, otherTeacher) {
                self.manager = manager;
                self.teacher = teacher;
                self.otherTeacher = otherTeacher;
            });
    });

    it("can save a view", function() {
        var self = this;
        return helpers.loginAsUser(self.teacher)
        .then(function(agent) {
            return agent
            .post("/api/views")
            .set("x-csrf-token", agent.csrfToken)
            .send({
                name: "My view",
                query: {
                    tags: ["foo|bar", "fizz|buzz"]
                }
            })
            .promise();
        })
        .then(function(res) {
            assert.equal(200, res.status, res.text);
            assert.equal("My view", res.body.name);
        });
    });


});


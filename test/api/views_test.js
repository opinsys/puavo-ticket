"use strict";

var Promise = require("bluebird");
var assert = require("assert");

var helpers = require("app/test/helpers");
var User = require("app/models/server/User");
var View = require("app/models/server/View");

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

    it("can save a view using POST", function() {
        return helpers.loginAsUser(helpers.user.teacher)
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

    it("can list views with GET", function() {
        return helpers.loginAsUser(helpers.user.teacher)
        .then(function(agent) {
            return agent.get("/api/views").promise();
        })
        .then(function(res) {
            assert.equal(200, res.status, res.text);
            assert.equal(1, res.body.length);
            var view = res.body[0];
            assert.equal("My view", view.name);
            assert.equal(1, view.id);
            assert.deepEqual({
                tags: ["foo|bar", "fizz|buzz"]
            }, view.query);
        });
    });

    it("users cannot access views of others", function() {
        return helpers.loginAsUser(helpers.user.teacher2)
        .then(function(agent) {
            return agent.get("/api/views").promise();
        })
        .then(function(res) {
            assert.equal(200, res.status, res.text);
            assert.equal(0, res.body.length);
        });
    });

    it("can filter views by name", function() {
        var self = this;
        return View.forge({
            createdById: self.teacher.get("id"),
            name: "Another",
            query: { foo: 1 }
        })
        .save()
        .then(function() {
            return helpers.loginAsUser(helpers.user.teacher);
        })
        .then(function(agent) {
            return agent.get("/api/views?name=Another").promise();
        })
        .then(function(res) {
            assert.equal(200, res.status, res.text);
            assert.equal(1, res.body.length);
            var view = res.body[0];
            assert.equal("Another", view.name);
            assert.equal(2, view.id);
            assert.deepEqual({
                foo: 1
            }, view.query);
        });
    });

    it("can delete views", function() {
        return helpers.loginAsUser(helpers.user.teacher)
        .then(function(agent) {
            return agent.delete("/api/views/1")
            .set("x-csrf-token", agent.csrfToken)
            .promise();
        })
        .then(function(res) {
            assert.equal(200, res.status, res.text);
        });
    });

    it("does not list deleted views", function() {
        return helpers.loginAsUser(helpers.user.teacher)
        .then(function(agent) {
            return agent.get("/api/views").promise();
        })
        .then(function(res) {
            assert.equal(200, res.status, res.text);
            assert.equal(1, res.body.length);
            var view = res.body[0];
            assert.equal("Another", view.name);
            assert.equal(2, view.id);
        });
    });

    it("other users cannot delete views of others", function() {
        return helpers.loginAsUser(helpers.user.teacher2)
        .then(function(agent) {
            return agent.delete("/api/views/2")
            .set("x-csrf-token", agent.csrfToken)
            .promise();
        })
        .then(function(res) {
            assert.equal(404, res.status, res.text);
        });
    });

    it("can replace views with same name", function() {
        var agent = null;
        return helpers.loginAsUser(helpers.user.teacher)
        .then(function(_agent) {
            agent = _agent;
            return agent
            .post("/api/views")
            .set("x-csrf-token", agent.csrfToken)
            .send({
                name: "Another",
                query: {
                    bar: 2
                }
            })
            .promise();
        })
        .then(function(res) {
            assert.equal(200, res.status, res.text);
            assert.equal("Another", res.body.name);
            assert.deepEqual({
                bar: 2
            }, res.body.query);


            return agent.get("/api/views").promise();
        })
        .then(function(res) {
            assert.equal(200, res.status, res.text);
            assert.equal(1, res.body.length);
            var view = res.body[0];
            assert.equal("Another", view.name);
            assert.deepEqual({
                bar: 2
            }, view.query);

        });
    });

});


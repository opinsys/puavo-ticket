"use strict";

var assert = require("assert");
var Promise = require("bluebird");
var nock = require("nock");
var _ = require("lodash");

var helpers = require("app/test/helpers");
var User = require("app/models/server/User");
var Ticket = require("app/models/server/Ticket");



describe("/api/tickets/:id/handlers", function() {

    before(function() {
        var self = this;

        return helpers.clearTestDatabase()
            .then(function() {
                return Promise.join(
                    User.ensureUserFromJWTToken(helpers.user.teacher),
                    User.ensureUserFromJWTToken(helpers.user.teacher2)
                );
            })
            .spread(function(user, otherUser) {
                self.user = user;
                self.otherUser = otherUser;

                return helpers.loginAsUser(helpers.user.manager);
            })
            .then(function(agent) {
                self.agent = agent;

                return Ticket.create(
                    "Handler testing ticket",
                    "foo",
                    self.user
                );
            })
            .then(function(ticket) {
                self.ticket = ticket;
            });
    });

    after(function() {
        return this.agent.logout();
    });

    it("creator cannot add handlers", function() {
        var self = this;
        return helpers.loginAsUser(helpers.user.teacher)
        .then(function(agent) {
            return agent
            .post("/api/tickets/" + self.ticket.get("id") + "/handlers")
            .set("x-csrf-token", agent.csrfToken)
            .send({
                username: self.otherUser.get("externalData").username,
                organisation_domain: self.otherUser.get("externalData").organisation_domain
            })
            .promise();
        })
        .then(function(res) {
            assert.equal(403, res.status, res.text);
            assert.equal("permission denied", res.body.error);
        });
    });


    it("manager can add a handler to a ticket", function() {
        var self = this;

        nock("https://test-api.opinsys.example")
        .get("/v3/users/matti.meikalainen")
        .matchHeader("Authorization", 'Basic cHVhdm8tdGlja2V0OnBhc3N3b3Jk')
        .reply(200, self.otherUser.get("externalData"));

        return this.agent
            .post("/api/tickets/" + self.ticket.get("id") + "/handlers")
            .set("x-csrf-token", self.agent.csrfToken)
            .send({
                username: self.otherUser.get("externalData").username,
                organisation_domain: self.otherUser.get("externalData").organisation_domain
            })
            .promise()
            .then(function(res) {
                assert.equal(200, res.status, res.text);
                assert(res.body.id, "got handler relation id");
                assert(_.isObject(res.body.handler), "has handler object");
                assert.equal(self.otherUser.get("id"), res.body.handler.id);
                assert(res.body.createdBy, "has created by object");
            });
    });

    it("lists handlers as an objects in /api/tickets", function() {
        var self = this;

        return this.agent
            .get("/api/tickets/")
            .promise()
            .then(function(res) {
                assert.equal(200, res.status, res.text);
                var ticket = _.find(res.body, { id: self.ticket.get("id")});
                assert(ticket);
                assert(ticket.handlers, "has handlers array in the response");

                assert(ticket.handlers.some(function(h) {
                    return h.handler.externalData.username === "matti.meikalainen";
                }), "has matti.meikalainen as a handler");

            });
    });

    it("lists handlers with createdBy object in /api/tickets/:id", function() {
        var self = this;

        return this.agent
            .get("/api/tickets/" + self.ticket.get("id"))
            .promise()
            .then(function(res) {
                assert.equal(200, res.status, res.text);
                var ticket = res.body;
                assert(ticket);
                assert(ticket.handlers, "has handlers array in the response");

                assert(ticket.handlers.some(function(h) {
                    return h.handler.externalData.username === "matti.meikalainen";
                }), "has matti.meikalainen as a handler");

                assert(ticket.handlers.some(function(h) {
                    return h.createdBy.externalData.username === "pointyhair";
                }), "has pointyhair as the handler relation creator");

            });
    });

    it("creator cannot delete handlers", function() {
        var self = this;
        return helpers.loginAsUser(helpers.user.teacher)
        .then(function(agent) {
            return agent.delete(
                "/api/tickets/" + self.ticket.get("id") + "/handlers/" + self.otherUser.get("id")
            ).set("x-csrf-token", agent.csrfToken)
            .promise();
        })
        .then(function(res) {
            assert.equal(403, res.status, res.text);
            assert.equal("permission denied", res.body.error);
        });
    });

    it("handler can be removed using DELETE by manager", function() {
        var self = this;
        return self.agent.delete(
            "/api/tickets/" + self.ticket.get("id") + "/handlers/" + self.otherUser.get("id")
        ).set("x-csrf-token", self.agent.csrfToken)
        .promise().then(function(res) {
            assert.equal(200, res.status, res.text);
            assert.equal(self.otherUser.get("id"), res.body.handler);
        });
    });

    it("the removed handler marked as removed in /api/tickets/:id", function() {
        var self = this;

        return this.agent
            .get("/api/tickets/" + self.ticket.get("id"))
            .promise()
            .then(function(res) {
                assert.equal(200, res.status, res.text);

                var handler = _.find(res.body.handlers, {
                    handledById: self.otherUser.get("id")
                });
                assert(handler);
                assert(handler.deletedAt);
            });
    });

    it("can readd deleted handler", function() {
        var self = this;

        nock("https://test-api.opinsys.example")
        .get("/v3/users/matti.meikalainen")
        .matchHeader("Authorization", 'Basic cHVhdm8tdGlja2V0OnBhc3N3b3Jk')
        .reply(200, self.otherUser.get("externalData"));

        return this.agent
        .post("/api/tickets/" + self.ticket.get("id") + "/handlers")
        .set("x-csrf-token", self.agent.csrfToken)
        .send({
            username: self.otherUser.get("externalData").username,
            organisation_domain: self.otherUser.get("externalData").organisation_domain
        })
        .promise()
        .then(function(res) {
            assert.equal(200, res.status);

            return self.agent.get(
                "/api/tickets/" + self.ticket.get("id")
            ).promise();
        })
        .then(function(res) {
            assert.equal(200, res.status, res.text);

            var handler = _.find(res.body.handlers, {
                handledById: self.otherUser.get("id"),
                deleted: 0
            });
            assert(handler, "the handler is not deleted anymore");
        });
    });

});

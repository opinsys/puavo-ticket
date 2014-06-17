"use strict";

var assert = require("assert");
var Promise = require("bluebird");
var nock = require("nock");
var _ = require("lodash");

var helpers = require("../helpers");
var User = require("../../models/server/User");



describe("/api/tickets/:id/handlers", function() {

    before(function() {
        var self = this;

        return helpers.clearTestDatabase()
            .then(function() {
                return Promise.all([
                    User.ensureUserFromJWTToken(helpers.user.teacher),
                    User.ensureUserFromJWTToken(helpers.user.teacher2)
                ]);
            })
            .spread(function(user, otherUser) {
                self.user = user;
                self.otherUser = otherUser;

                return helpers.loginAsUser(helpers.user.manager);
            })
            .then(function(agent) {
                self.agent = agent;

                return helpers.insertTestTickets(self.user);
            })
            .then(function(tickets) {
                self.ticket = tickets.ticket;
            });
    });

    after(function() {
        return this.agent.logout();
    });


    it("can add handler to a ticket", function() {
        var self = this;

        nock("https://testing.opinsys.fi")
        .get("/v3/users/matti.meikalainen")
        .matchHeader("Authorization", 'Basic cHVhdm8tdGlja2V0OnBhc3N3b3Jk')
        .reply(200, self.otherUser.get("external_data"));

        return this.agent
            .post("/api/tickets/" + self.ticket.get("id") + "/handlers")
            .send({
                username: self.otherUser.get("external_data").username,
                organisation_domain: self.otherUser.get("external_data").organisation_domain
            })
            .promise()
            .then(function(res) {
                assert.equal(200, res.status);
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
                assert.equal(200, res.status);
                var ticket = _.find(res.body, { id: self.ticket.get("id")});
                assert(ticket);
                assert(ticket.handlers, "has handlers array in the response");

                assert(ticket.handlers.some(function(h) {
                    return h.handler.external_data.username === "matti.meikalainen";
                }), "has matti.meikalainen as a handler");

            });
    });

    it("lists handlers with createdBy object in /api/tickets/:id", function() {
        var self = this;

        return this.agent
            .get("/api/tickets/" + self.ticket.get("id"))
            .promise()
            .then(function(res) {
                assert.equal(200, res.status);
                var ticket = res.body;
                assert(ticket);
                assert(ticket.handlers, "has handlers array in the response");

                assert(ticket.handlers.some(function(h) {
                    return h.handler.external_data.username === "matti.meikalainen";
                }), "has matti.meikalainen as a handler");

                assert(ticket.handlers.some(function(h) {
                    return h.createdBy.external_data.username === "pointyhair";
                }), "has pointyhair as the handler relation creator");

            });
    });

});

"use strict";

var assert = require("assert");
var Promise = require("bluebird");
var nock = require("nock");

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

                return helpers.loginAsUser(helpers.user.teacher);
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
                assert.equal(self.otherUser.get("id"), res.body.handler);
            });
    });

    it("handler is visible in the updates api", function() {
        var self = this;

        return this.agent
            .get("/api/tickets/" + self.ticket.get("id") + "/updates")
            .promise()
            .then(function(res) {
                assert.equal(200, res.status);
                var handlers = res.body.filter(function(update) {
                    return update.type === "handlers";
                });
                assert.equal(1, handlers.length);
                assert.equal(
                    "matti.meikalainen",
                    handlers[0].handler.external_data.username
                );
            });
    });

});

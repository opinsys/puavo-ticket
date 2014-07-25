"use strict";

var assert = require("assert");

var helpers = require("../helpers");

var nock = require('nock');

var User = require("../../models/server/User");

function mockJoeBloggsAPI() {
    nock("https://testing.opinsys.fi")
    .get("/v3/users/joe.bloggs")
    .matchHeader("Authorization", 'Basic cHVhdm8tdGlja2V0OnBhc3N3b3Jk')
    .reply(200, {
        organisation_domain: "testing.opinsys.fi",
        email: "joe.bloggs@test.com",
        first_name: "Joe",
        last_name: "Bloggs",
        username: "joe.bloggs",
        id: "1432"
    });
}

describe("/api/tickets/:id/related_users", function() {

    before(function() {
        var self = this;

        return helpers.clearTestDatabase()
            .then(function() {
                return helpers.loginAsUser(helpers.user.teacher);
            })
            .then(function(agent) {
                self.agent = agent;

                return helpers.fetchTestUser();
            })
            .then(function(user) {
                self.user = user;

                return helpers.insertTestTickets(user);
            })
            .then(function(tickets) {
                self.ticket = tickets.ticket;
                self.otherTicket = tickets.otherTicket;
            });
    });

    after(function() {
        return this.agent.logout();
    });

    it("can add related user to a ticket", function() {
        var self = this;

        mockJoeBloggsAPI();

        return this.agent
            .post("/api/tickets/" + self.ticket.get("id") + "/related_users")
            .send({
                external_id: "1432",
                username: "joe.bloggs",
                domain: "testing.opinsys.fi"
            })
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(res.body.ticket_id, self.ticket.get("id"));
                assert.equal(res.body.createdById, self.user.id);
            })
            .then(function() {
                return User.forge({ external_id: "1432" }).fetch();
            })
            .then(function(related_user) {
                assert.equal(related_user.get("external_data").username, "joe.bloggs");
            });
    });

    it("related user is visible in the tickets api", function() {
        var self = this;

        return this.agent
            .get("/api/tickets/" + self.ticket.get("id"))
            .promise()
            .then(function(res) {
                assert.equal(200, res.status);
                assert(res.body.relatedUsers, "response has a relatedUsers attr");
                var relatedUser = res.body.relatedUsers[0];
                assert(relatedUser.user.external_data, "user relation is present");
                assert.equal("joe.bloggs", relatedUser.user.external_data.username);
                assert(relatedUser.createdBy, "createdBy relation is present");
            });
    });

    it("can add related user to a other ticket when related user exists on the users table", function() {
        mockJoeBloggsAPI();
        var self = this;

        return this.agent
            .post("/api/tickets/" + self.otherTicket.get("id") + "/related_users")
            .send({
                external_id: "1432",
                username: "joe.bloggs",
                domain: "testing.opinsys.fi"
            })
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(res.body.ticket_id, self.otherTicket.get("id"));
                assert.equal(res.body.createdById, self.user.id);
            })
            .then(function() {
                return User.forge({ external_id: "1432" }).fetch();
            })
            .then(function(related_user) {
                assert.equal(related_user.get("external_data").username, "joe.bloggs");
            });
    });

});

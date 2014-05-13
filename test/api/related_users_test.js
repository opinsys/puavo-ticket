"use strict";

var assert = require("assert");

var helpers = require("../helpers");

var nock = require('nock');

var User = require("../../models/server/User");

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
            });
    });

    after(function() {
        return this.agent.logout();
    });

    it("can add related user to a ticket", function() {
        var self = this;

        nock("https://testing.opinsys.fi")
        .get("/v3/users/joe.bloggs")
        .reply(200, {
            organisation_domain: "testing.opinsys.fi",
            email: "joe.bloggs@test.com",
            first_name: "Joe",
            last_name: "Bloggs",
            username: "joe.bloggs",
            id: "1432"
        });

        return this.agent
            .post("/api/tickets/" + self.ticket.get("id") + "/related_users")
            .send({
                external_id: "1432",
                external_domain: "testing.opinsys.fi"
            })
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(res.body.ticket_id, self.ticket.get("id"));
                assert.equal(res.body.created_by, self.user.id);
            })
            .then(function() {
                return User.forge({ external_id: "1432" }).fetch();
            })
            .then(function(related_user) {
                assert.equal(related_user.get("external_data").username, "joe.bloggs");
            });
    });

    it("related user is visible in the updates api", function() {
        var self = this;

        return this.agent
            .get("/api/tickets/" + self.ticket.get("id") + "/updates")
            .promise()
            .then(function(res) {
                assert.equal(200, res.status);

                var relatedUsers = res.body.filter(function(update) {
                    return update.type === "related_users";
                });

                assert.equal(1, relatedUsers.length);
                assert.equal("olli.opettaja", relatedUsers[0].user.external_data.username);
            });
    });

});

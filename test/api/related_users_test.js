"use strict";

var assert = require("assert");

var helpers = require("../helpers");

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

        return this.agent
            .post("/api/tickets/" + self.ticket.get("id") + "/related_users")
            .send({ id: self.user.id })
            .promise()
            .then(function(res) {
                assert.equal(200, res.status);
                assert.equal(self.user.get("id"), res.body.user);
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

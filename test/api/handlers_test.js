"use strict";

var helpers = require("../helpers");

var assert = require("assert");


describe("/api/tickets/:id/handlers", function() {

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


    it("can add handler to a ticket", function() {
        var self = this;

        return this.agent
            .post("/api/tickets/" + self.ticket.get("id") + "/handlers")
            .send({ id: self.user.id })
            .promise()
            .then(function(res) {
                assert.equal(200, res.status);
                assert.equal(self.user.id, res.body.handler);
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
                assert.equal("olli.opettaja", handlers[0].handler.external_data.username);
            });
    });

});

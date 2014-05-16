"use strict";

var assert = require("assert");
var Promise = require("bluebird");

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

        return this.agent
            .post("/api/tickets/" + self.ticket.get("id") + "/handlers")
            .send({ id: self.otherUser.get("id") })
            .promise()
            .then(function(res) {
                assert.equal(200, res.status);
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

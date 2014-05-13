
"use strict";

var assert = require("assert");
var _ = require("lodash");

var helpers = require("../helpers");
var User = require("../../models/server/User");



describe("/api/tickets/:id/status", function() {

    before(function() {
        var self = this;

        return helpers.clearTestDatabase()
            .then(function() {
                return helpers.loginAsUser(helpers.user.teacher);
            })
            .then(function(agent) {
                self.agent = agent;

                return User.byExternalId(helpers.user.teacher.id).fetch();
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

    it("sets the status for a ticket", function() {

        return this.agent
            .put("/api/tickets/" + this.ticket.get("id") + "/status")
            .send({ status: "foostatus" })
            .promise()
            .then(function(res) {
                assert.equal(200, res.status);
                assert.equal("status:foostatus", res.body.tag);
            });
    });

    it("is available in /api/tickets/:id/updates", function() {
        return this.agent
            .get("/api/tickets/" + this.ticket.get("id") + "/updates")
            .promise()
            .then(function(res) {
                assert.equal(200, res.status);
                var statuses = res.body.filter(function(update) {
                    return update.tag === "status:foostatus";
                });
                assert.equal(1, statuses.length);
            });
    });

    it("is available in /api/tickets as plain string", function() {
        var self = this;
        return this.agent
            .put("/api/tickets/" + this.otherTicket.get("id") + "/status")
            .send({ status: "barstatus" })
            .promise()
            .then(function(res) {
                assert.equal(200, res.status);
                assert.equal("status:barstatus", res.body.tag);

                return self.agent.get("/api/tickets").promise();
            })
            .then(function(res) {
                assert.equal(2, res.body.length);

                var ticket = _.find(res.body, function(t) {
                    return t.title === self.ticket.get("title");
                });
                assert(ticket);
                assert.equal(
                    "foostatus",
                    ticket.status,
                    "first ticket has a plain status property"
                );

                var otherTicket = _.find(res.body, function(t) {
                    return t.title === self.otherTicket.get("title");
                });
                assert(otherTicket);
                assert.equal(
                    "barstatus",
                    otherTicket.status,
                    "second ticket has a plain status property"
                );

            });

    });


});

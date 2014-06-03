
"use strict";

var assert = require("assert");
var _ = require("lodash");

var helpers = require("../helpers");
var User = require("../../models/server/User");



describe("/api/tickets/:id/tags", function() {

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
            .post("/api/tickets/" + this.ticket.get("id") + "/tags")
            .send({ tag: "status:foostatus" })
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

    it("is available in /api/tickets as an array", function() {
        var self = this;
        return this.agent
            .post("/api/tickets/" + this.otherTicket.get("id") + "/tags")
            .send({ tag: "status:barstatus" })
            .promise()
            .then(function(res) {
                assert.equal(200, res.status);
                assert.equal("status:barstatus", res.body.tag);

                return self.agent.get("/api/tickets").promise();
            })
            .then(function(res) {
                assert.equal(2, res.body.length);

                var ticket = _.findWhere(res.body, {
                    title: self.ticket.get("title")
                });
                assert(ticket);
                assert(
                    _.findWhere(ticket.eagerUpdates, { tag: "status:foostatus" }),
                    "has 'status:foostatus' tag"
                );


                var otherTicket = _.findWhere(res.body, {
                    title: self.otherTicket.get("title")
                });
                assert(otherTicket);
                assert(
                    _.findWhere(otherTicket.eagerUpdates, { tag: "status:barstatus" }),
                    "has 'status:barstatus' tag"
                );

            });

    });


});

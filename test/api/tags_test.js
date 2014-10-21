
"use strict";

var assert = require("assert");
var _ = require("lodash");

var helpers = require("app/test/helpers");
var User = require("app/models/server/User");



describe("/api/tickets/:id/tags", function() {

    before(function() {
        var self = this;

        return helpers.clearTestDatabase()
            .then(function() {
                return helpers.loginAsUser(helpers.user.manager);
            })
            .then(function(agent) {
                self.agent = agent;

                return User.byExternalId(helpers.user.manager.id).fetch();
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

    it("sets the tag for a ticket", function() {
        return this.agent
            .post("/api/tickets/" + this.ticket.get("id") + "/tags")
            .send({ tag: "footag" })
            .promise()
            .then(function(res) {
                assert.equal(200, res.status, res.text);
                assert.equal("footag", res.body.tag);
            });
    });

    it("is available in /api/tickets as an array", function() {
        var self = this;
        return this.agent
            .post("/api/tickets/" + this.otherTicket.get("id") + "/tags")
            .send({ tag: "bartag" })
            .promise()
            .then(function(res) {
                assert.equal(200, res.status, res.text);
                assert.equal("bartag", res.body.tag);

                return self.agent.get("/api/tickets").promise();
            })
            .then(function(res) {
                assert.equal(2, res.body.length);

                var ticket = _.find(res.body, {
                    id: self.ticket.get("id")
                });
                assert(ticket);
                assert(
                    _.find(ticket.tags, { tag: "footag" }),
                    "footag"
                );


                var otherTicket = _.find(res.body, { id: self.otherTicket.get("id") });
                assert(otherTicket);
                assert(
                    _.findWhere(otherTicket.tags, { tag: "bartag" }),
                    "bartag"
                );

            });

    });


});

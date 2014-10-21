
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
        var self = this;
        return this.agent
            .post("/api/tickets/" + self.ticket.get("id") + "/tags")
            .set("x-csrf-token", self.agent.csrfToken)
            .send({ tag: "footag" })
            .promise()
            .then(function(res) {
                assert.equal(200, res.status, res.text);
                assert.equal("footag", res.body.tag);
            });
    });

    it("is available in /api/tickets/:id", function() {
        var self = this;
        return self.agent.get(
            "/api/tickets/" + self.ticket.get("id")
        ).promise().then(function(res) {
            assert.equal(200, res.status, res.text);
            assert(
                _.find(res.body.tags, { tag: "footag", deleted: 0 }),
                "footag"
            );
        });
    });

    it("is available in /api/tickets as an array", function() {
        var self = this;
        return this.agent
            .post("/api/tickets/" + this.otherTicket.get("id") + "/tags")
            .set("x-csrf-token", self.agent.csrfToken)
            .send({ tag: "bartag" })
            .promise()
            .then(function(res) {
                assert.equal(200, res.status, res.text);
                assert.equal("bartag", res.body.tag);

                return self.agent.get("/api/tickets").promise();
            })
            .then(function(res) {
                assert.equal(200, res.status, res.text);
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

    it("can delete tags with DELETE", function() {
        var self = this;
        return this.agent
        .delete("/api/tickets/" + self.ticket.get("id") + "/tags/footag")
        .set("x-csrf-token", self.agent.csrfToken)
        .send({})
        .promise()
        .then(function(res) {
            assert.equal(200, res.status, res.text);
            assert.equal(1, res.body.length);
            assert.equal("footag", res.body[0].tag);

            return self.agent.get(
                "/api/tickets/" + self.ticket.get("id")
            ).promise();
        })
        .then(function(res) {
            assert.equal(200, res.status, res.text);
            var tag = _.find(res.body.tags, { tag: "footag" });
            assert(tag);
            assert(tag.deleted !== 0, "the footag should have been soft deleted");
        });
    });

    it("DELETE on unknown tickets responds 404", function() {
        var self = this;
        return this.agent
        .delete("/api/tickets/69/tags/footag")
        .set("x-csrf-token", self.agent.csrfToken)
        .send({})
        .promise()
        .then(function(res) {
            assert.equal(404, res.status, res.text);
            assert.equal("ticket not found", res.body.error);
        });
    });


});

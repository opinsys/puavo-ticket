"use strict";

var _ = require("lodash");
var assert = require("assert");

var helpers = require("../helpers");

describe("/api/tickets", function() {

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
            });
    });

    after(function() {
        return this.agent.logout();
    });

    it("can create a ticket using POST", function() {
        var self = this;
        return this.agent
            .post("/api/tickets")
            .send({
                description: "Computer does not work"
            })
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(res.body.description, "Computer does not work");
                assert.equal(res.body.createdById, self.user.get("id"));
                assert(res.body.id, "has id");
                self.ticket = res.body;
            });

    });

    it("can get the ticket using GET", function() {
        var self = this;
        return this.agent
            .get("/api/tickets")
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(1, res.body.length);
                assert.equal(self.ticket.id, res.body[0].id);
                assert.equal("Computer does not work", res.body[0].description);
                assert.equal(self.ticket.id, res.body[0].id);
                assert(
                    _.findWhere(res.body[0].tags, { tag: "status:open" }),
                    "has status:open tag"
                );
            });
    });

    it("other users cannot see the ticket on /api/tickets", function() {
        return helpers.loginAsUser(helpers.user.teacher2)
            .then(function(agent) {
                return agent.get("/api/tickets").promise();
            })
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(0, res.body.length);
            });
    });

    it("other users cannot see the ticket on /api/tickets/:id", function() {
        var self = this;
        return helpers.loginAsUser(helpers.user.teacher2)
            .then(function(agent) {
                return agent.get("/api/tickets/" + self.ticket.id).promise();
            })
            .then(function(res) {
                assert.equal(404, res.status);
                assert.deepEqual({error: "not found"}, res.body);
            });
    });

    it("but manager can see it", function() {
        return helpers.loginAsUser(helpers.user.manager)
            .then(function(agent) {
                return agent.get("/api/tickets").promise();
            })
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(1, res.body.length);
                assert.equal("Computer does not work", res.body[0].description);
            });
    });

    it("user in the same organisation can see the ticket if ticket has the organisation visibility", function() {
        return this.agent
            .post("/api/tickets/" + this.ticket.id + "/visibilities")
            .send({
                visibilities: [ "organisation:" + helpers.user.teacher2.organisation_domain ]
            })
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(res.body[0].entity, "organisation:testing.opinsys.fi");
            })
            .then(function() {
                return helpers.loginAsUser(helpers.user.teacher2);
            })
            .then(function(agent) {
                return agent.get("/api/tickets").promise();
            })
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(1, res.body.length);
                assert.equal("Computer does not work", res.body[0].description);
            });
    });

    it("can get single ticket using GET", function() {
        var self = this;
        return this.agent
            .get("/api/tickets/" + self.ticket.id)
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(self.ticket.id, res.body.id);
                assert.equal("Computer does not work", res.body.description);
                assert(
                    _.findWhere(res.body.tags, { tag: "status:open" }),
                    "has status:open tag"
                  );
            });
    });


});

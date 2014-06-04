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
                title: "Computer does not work",
                description: "It just doesnt"
            })
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(res.body.title, "Computer does not work");
                assert.equal(res.body.created_by, self.user.get("id"));
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
                assert.equal("Computer does not work", res.body[0].title);
                assert.equal(self.ticket.id, res.body[0].id);
                assert(
                    _.findWhere(res.body[0].tags, { tag: "status:open" }),
                    "has status:open tag"
                );
            });
    });

    it("other users cannot see the ticket", function() {
        return helpers.loginAsUser(helpers.user.teacher2)
            .then(function(agent) {
                return agent.get("/api/tickets").promise();
            })
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(0, res.body.length);
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
                assert.equal("Computer does not work", res.body[0].title);
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
                assert.equal("Computer does not work", res.body.title);
                assert(
                    _.findWhere(res.body.tags, { tag: "status:open" }),
                    "has status:open tag"
                  );
            });
    });

    it("can update ticket using PUT", function() {
        var self = this;
        return this.agent
            .put("/api/tickets/" + self.ticket.id)
            .send({
                title: "updated ticket",
                description: "It just doesnt"
            })
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(
                    res.body.title,
                    "updated ticket",
                    "Responds with updated ticket data"
                );
                assert(res.body.id, "has id");
            });
    });

    it("can get updated ticket using GET", function() {
        var self = this;
        return this.agent
            .get("/api/tickets/" + self.ticket.id)
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(self.ticket.id, res.body.id);
                assert.equal("updated ticket", res.body.title);
            });
    });

});

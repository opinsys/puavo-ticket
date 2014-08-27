"use strict";

var Promise = require("bluebird");
var _ = require("lodash");
var assert = require("assert");

var helpers = require("app/test/helpers");

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
        return self.agent
            .post("/api/tickets")
            .send({})
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(res.body.createdById, self.user.get("id"));
                assert(res.body.id, "has id");
                self.ticket = res.body;

                return Promise.join(
                    self.agent.post("/api/tickets/" + res.body.id + "/titles")
                        .send({ title: "A title" })
                        .promise(),
                    self.agent.post("/api/tickets/" + res.body.id + "/comments")
                        .send({ comment: "Computer does not work"})
                        .promise()
                );
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

                assert.equal(self.ticket.id, res.body[0].id);
                assert(
                    _.find(res.body[0].tags, { tag: "status:open" }),
                    "has status:open tag"
                );

                assert(
                    _.find(res.body[0].titles, { title: "A title" }),
                    "has a title"
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
                assert(
                    _.find(res.body[0].titles, { title: "A title" }),
                    "has a title"
                );
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
                assert(
                    _.find(res.body[0].titles, { title: "A title" }),
                    "has a title"
                );
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

                assert(
                    _.find(res.body.titles, { title: "A title" }),
                    "has a title"
                );

                assert(
                    _.findWhere(res.body.tags, { tag: "status:open" }),
                    "has status:open tag"
                );

                assert(
                    _.find(res.body.comments, { comment: "Computer does not work"}),
                    "has comments"
                );
            });
    });


});

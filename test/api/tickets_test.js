"use strict";

var Promise = require("bluebird");
var _ = require("lodash");
var assert = require("assert");

var helpers = require("app/test/helpers");
var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");

describe("/api/tickets", function() {

    before(function() {
        var self = this;

        return helpers.clearTestDatabase()
            .then(function() {
                return Promise.join(
                    User.ensureUserFromJWTToken(helpers.user.manager),
                    User.ensureUserFromJWTToken(helpers.user.teacher),
                    User.ensureUserFromJWTToken(helpers.user.teacher2)
                );
            })
            .spread(function(manager, teacher, otherTeacher) {
                self.manager = manager;
                self.teacher = teacher;
                self.otherTeacher = otherTeacher;
            })
            .then(function() {
                return helpers.loginAsUser(helpers.user.teacher);
            })
            .then(function(agent) {
                self.agent = agent;
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
                assert.equal(res.body.createdById, self.teacher.get("id"));
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
                    _.find(res.body[0].tags, { tag: "status:pending" }),
                    "has status:pending tag"
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
                    _.findWhere(res.body.tags, { tag: "status:pending" }),
                    "has status:pending tag"
                );

                assert(
                    _.find(res.body.comments, { comment: "Computer does not work"}),
                    "has comments"
                );
            });
    });

    it("can filter by tags", function() {
        var self = this;
        return Ticket.create("Ticket with foo tag", "plaa", self.teacher)
        .then(function(ticket) {
            return ticket.addTag("foo", self.teacher);
        })
        .then(function() {
            return helpers.loginAsUser(helpers.user.teacher);
        })
        .then(function(agent) {
            return agent.get("/api/tickets?tags=foo").promise();
        })
        .then(function(res) {
            assert.equal(res.status, 200);
            assert.equal(1, res.body.length);
            assert.equal(
                "Ticket with foo tag",
                res.body[0].titles[0].title
            );
        });
    });

    it("can filter by multiple tags", function() {
        var self = this;
        return Ticket.create("Ticket with bar tag", "plaa", self.teacher)
        .then(function(ticket) {
            return ticket.addTag("bar", self.teacher);
        })
        .then(function() {
            return helpers.loginAsUser(helpers.user.teacher);
        })
        .then(function(agent) {
            return agent.get("/api/tickets?tags=foo|bar").promise();
        })
        .then(function(res) {
            assert.equal(res.status, 200);
            assert.equal(2, res.body.length);
        });
    });

    it("can require multiple tags", function() {
        var self = this;
        return Ticket.create("Ticket with foo and bar", "plaa", self.teacher)
        .then(function(ticket) {
            return Promise.join(
                ticket.addTag("foo", self.teacher),
                ticket.addTag("bar", self.teacher)
            );
        })
        .then(function() {
            return helpers.loginAsUser(helpers.user.teacher);
        })
        .then(function(agent) {
            return agent.get("/api/tickets?tags=foo&tags=bar").promise();
        })
        .then(function(res) {
            assert.equal(res.status, 200);
            assert.equal(1, res.body.length);
            assert.equal(
                "Ticket with foo and bar",
                res.body[0].titles[0].title
            );
        });
    });

});

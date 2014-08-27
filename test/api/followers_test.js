"use strict";
var assert = require("assert");
var _ = require("lodash");
var Promise = require("bluebird");

var helpers = require("app/test/helpers");
var User = require("app/models/server/User");
var Ticket = require("app/models/server/Ticket");


describe("/api/tickets/:id/followers", function() {

    before(function() {
        var self = this;

        return helpers.clearTestDatabase()
            .then(function() {
                return Promise.all([
                    User.ensureUserFromJWTToken(helpers.user.teacher),
                    User.ensureUserFromJWTToken(helpers.user.manager),
                ]);
            })
            .spread(function(teacher, manager) {
                self.teacher = teacher;
                self.manager = manager;

                return Ticket.create(
                    "Followers test",
                    "Ticket with followers",
                    teacher
                );
            })
            .then(function(ticket) {
                self.ticket = ticket;
                return ticket.addTitle("Followers tes", self.teacher);
            })
            .then(function() {
                return helpers.loginAsUser(helpers.user.manager);
            })
            .then(function(agent) {
                self.agent = agent;
            });
    });

    after(function() {
        return this.agent.logout();
    });

    it("creator is a follower", function() {
        var self = this;
        return this.agent
            .get("/api/tickets/" + self.ticket.id)
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200, res.text);
                assert(res.body.followers, "has followers property");
                assert.equal(res.body.followers.length, 1,  "has one follower");
                assert.equal(
                    res.body.followers[0].followedById,
                    self.teacher.get("id")
                );
            });
    });

    it("user can add itself as a follower", function() {
        var self = this;
        return self.agent
            .post("/api/tickets/" + self.ticket.id + "/followers")
            .send({})
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200, res.text);
                return self.agent.get("/api/tickets/" + self.ticket.id).promise();
            })
            .then(function(res) {
                assert.equal(res.status, 200, res.text);
                assert(res.body.followers, "has followers property");
                assert.equal(res.body.followers.length, 2,  "has two followers");

                assert(_.findWhere(res.body.followers, function(f) {
                    return f.follower.externalData.id === helpers.user.manager.id;
                }), "the user is a follower");
            });
    });

    it("user can remove itself from the followers", function() {
        var self = this;
        return self.agent
            .delete("/api/tickets/" + self.ticket.id + "/followers/" + self.manager.get("id"))
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200, res.text);
                return self.agent.get("/api/tickets/" + self.ticket.id).promise();
            })
            .then(function(res) {
                assert.equal(res.status, 200, res.text);
                assert(res.body.followers, "has followers property");
                assert.equal(res.body.followers.length, 1,  "has only one follower");
                assert(_.findWhere(res.body.followers, function(f) {
                    return f.follower.externalData.id === helpers.user.teacher.id;
                }), "the user is a follower");
            });
    });

    it("other users cannot follow tickets they do not have visibilities to", function() {
        var self = this;
        return helpers.loginAsUser(helpers.user.teacher2)
            .then(function(agent) {
                return agent.post("/api/tickets/" + self.ticket.id + "/followers")
                    .send({}).promise();
            })
            .then(function(res) {
                assert.equal(res.status, 404, res.text);
            });
    });

});

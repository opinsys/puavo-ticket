"use strict";
var assert = require("assert");
var _ = require("lodash");

var helpers = require("../helpers");
var User = require("../../models/server/User");
var Ticket = require("../../models/server/Ticket");


describe("/api/tickets/:id/followers", function() {

    before(function() {
        var self = this;

        return helpers.clearTestDatabase()
            .then(function() {
                return User.ensureUserFromJWTToken(helpers.user.teacher);
            })
            .then(function(user) {
                self.user = user;

                return Ticket.forge({
                    description: "Ticket with followers",
                    createdById: user.get("id")
                }).save();
            })
            .then(function(ticket) {
                self.ticket = ticket;
                return ticket.addTitle("Followers tes", self.user);
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
                assert.equal(res.status, 200);
                assert(res.body.followers, "has followers property");
                assert.equal(res.body.followers.length, 1,  "has one follower");
                assert.equal(
                    res.body.followers[0].followedById,
                    self.user.get("id")
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
                assert.equal(res.status, 200);
                return self.agent.get("/api/tickets/" + self.ticket.id).promise();
            })
            .then(function(res) {
                assert.equal(res.status, 200);
                assert(res.body.followers, "has followers property");
                assert.equal(res.body.followers.length, 2,  "has two followers");

                assert(_.findWhere(res.body.followers, function(f) {
                    return f.follower.externalData.id === helpers.user.manager.id;
                }), "the user is a follower");
            });
    });



});

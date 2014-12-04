"use strict";

var Promise = require("bluebird");
var assert = require("assert");

var helpers = require("app/test/helpers");
var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");

describe("/api/tickets", function() {

    before(function() {
        return helpers.clearTestDatabase()
        .then(() => User.ensureUserFromJWTToken(helpers.user.teacher))
        .then(teacher => this.teacher = teacher)
        .then(() => Promise.join(
            Ticket.create("Footitle ticket", "Foodesc", this.teacher),
            Ticket.create("Bartitle ticket weirdlaptop", "Bardesc", this.teacher),
            Ticket.create("Baztitle ticket", "Bazdesc weirdlaptop", this.teacher)
        ))
        .then(() => helpers.loginAsUser(helpers.user.teacher))
        .then(agent => this.agent = agent);
    });

    it("can search tickets by text", function() {
        return this.agent
            .get("/api/tickets?text=footitle")
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(1, res.body.length);
                assert.equal("Footitle ticket", res.body[0].titles[0].title);
            });
    });

    it("can search tickets by multiple text queries", function() {
        return this.agent
            .get("/api/tickets?text=foo+title")
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(1, res.body.length);
                assert.equal("Footitle ticket", res.body[0].titles[0].title);
            });
    });

    it("can search from comments too", function() {
        return this.agent
            .get("/api/tickets?text=weird+laptop")
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(2, res.body.length);
            });
    });


});

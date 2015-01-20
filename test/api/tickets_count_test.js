"use strict";

var assert = require("assert");

var helpers = require("app/test/helpers");
var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");

describe("Can return only the ticket count for a query", function() {

    before(function() {
        var self = this;

        return helpers.clearTestDatabase()
            .then(function() {
                return User.ensureUserFromJWTToken(helpers.user.manager);
            })
            .then(function(manager) {
                self.manager = manager;

                return Ticket.create(
                    "Basic ticket",
                    "foo",
                    manager
                );
            })
            .then(function() {
                return Ticket.create(
                    "Basic ticket",
                    "foo",
                    self.manager
                );
            })
            .then(function(ticket) {
                return ticket.addTag("foo", self.manager);
            })
            .then(function() {
                return helpers.loginAsUser(helpers.user.manager);
            })
            .then(function(agent) {
                self.agent = agent;
            });
    });


    it("for all tickets", function() {
        return this.agent
            .get("/api/tickets?return=count")
            .promise()
            .then(function(res) {
                assert.equal(200, res.status);
                assert.equal(2, res.body.count, res.text);
            });
    });

    it("with tag filter", function() {
        return this.agent
            .get("/api/tickets?return=count&tags=foo")
            .promise()
            .then(function(res) {
                assert.equal(200, res.status);
                assert.equal(1, res.body.count, res.text);
            });
    });


});

"use strict";

var assert = require("assert");
var _ = require("lodash");

var helpers = require("app/test/helpers");
var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");

describe("limit&offset&sorting on /api/tickets", function() {

    before(function() {
        var self = this;

        return helpers.clearTestDatabase()
        .then(function() {
            return User.ensureUserFromJWTToken(helpers.user.manager);
        })
        .then(function(manager) {
            self.manager = manager;


            return _.range(1,10);
        })
        .each(function(number) {
            return Ticket.create(
                "A ticket " + number,
                "foo",
                self.manager
            ).then(function(ticket) {
                return ticket.set({
                    updatedAt: new Date(Date.now() + number*1000),
                    createdAt: new Date(Date.now() + number*1000)
                }).save();
            });
        })
        .then(function() {
            return helpers.loginAsUser(helpers.user.manager);
        })
        .then(function(agent) {
            self.agent = agent;
            self.assertQueryString = function(queryString, value) {
                return agent
                .get("/api/tickets?" + queryString)
                .promise()
                .then(function(res) {
                    assert.equal(200, res.status);
                    assert.deepEqual(
                        value,
                        _(res.body).pluck("titles").flatten().pluck("title").value()
                    );
                });
            };
        });
    });

    it("can list only 2 tickets", function() {
        return this.assertQueryString(
            "limit=2&orderBy=createdAt&direction=asc",
            ["A ticket 1","A ticket 2"]
        );
    });

    it("can change direction", function() {
        return this.assertQueryString(
            "limit=2&orderBy=createdAt&direction=desc",
            ["A ticket 9","A ticket 8"]
        );
    });

    it("can set offset", function() {
        return this.assertQueryString(
            "limit=2&orderBy=createdAt&direction=asc&offset=2",
            ["A ticket 3","A ticket 4"]
        );
    });

    it("can limit count too", function() {
        return this.agent.get("/api/tickets?limit=3&return=count").promise()
        .then(function(res) {
            assert.equal(200, res.status);
            assert.equal(3, res.body.count);
        });
    });

});

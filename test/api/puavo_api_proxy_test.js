"use strict";

var assert = require("assert");
var nock = require("nock");

var helpers = require("app/test/helpers");


describe("puavo-rest api proxy", function() {

    var agent;

    before(function() {
        return helpers.clearTestDatabase()
            .then(function(tickets) {
                return helpers.loginAsUser(helpers.user.teacher);
            })
            .then(function(_agent) {
                agent = _agent;
            });
    });

    after(function() {
        nock.cleanAll();
    });

    it("normal GET /api/puavo/testing.opinsys.fi/v3/devices", function() {
         nock("https://test-api.opinsys.example")
        .get("/v3/devices")
        .matchHeader("Host", "testing.opinsys.fi")
        .matchHeader("Authorization", "Basic cHVhdm8tdGlja2V0OnBhc3N3b3Jk")
        .reply(200, [ { username: "foo" } ]);

        return agent
            .get("/api/puavo/testing.opinsys.fi/v3/devices")
            .promise()
            .then(function(res) {
                assert.equal(200, res.status, res.text);
                assert.deepEqual(res.body, [{ username:"foo" }]);
            });
    });

    it("GET with querystring /api/puavo/testing.opinsys.fi/v3/devices", function() {
         nock("https://test-api.opinsys.example")
        .get("/v3/devices?foo=bar")
        .matchHeader("Host", "testing.opinsys.fi")
        .matchHeader("Authorization", "Basic cHVhdm8tdGlja2V0OnBhc3N3b3Jk")
        .reply(200, [{ username: "bar" }]);

        return agent
            .get("/api/puavo/testing.opinsys.fi/v3/devices?foo=bar")
            .promise()
            .then(function(res) {
                assert.equal(200, res.status, res.text);
                assert.deepEqual(res.body, [{ username:"bar" }]);
            });
    });

    it("does not allow POST requests", function() {
        return agent
            .post("/api/puavo/testing.opinsys.fi/v3/devices")
            .send({ hostname: "afat" })
            .promise()
            .then(function(res) {
                assert.equal(401, res.status, res.text);
            });
    });

    it("does not allow normal users to access other organisations", function() {
         nock("https://test-api.opinsys.example")
        .matchHeader("Host", "other.opinsys.fi")
        .get("/v3/users/foo")
        .reply(200, [{ username: "bar" }]);

        return agent
            .get("/api/puavo/other.opinsys.fi/v3/devices")
            .promise()
            .then(function(res) {
                assert.equal(res.status, 401);
            });
    });

    it("allows managers to access other organisations", function() {
         nock("https://test-api.opinsys.example")
        .matchHeader("Host", "other.opinsys.fi")
        .get("/v3/users/foo")
        .reply(200, [{ username: "bar" }]);

        return helpers.loginAsUser(helpers.user.manager)
            .then(function(managerAgent) {
                return managerAgent.get("/api/puavo/other.opinsys.fi/v3/users/foo").promise();
            })
            .then(function(res) {
                assert.equal(200, res.status, res.text);
            });
    });

    it("allows teachers to view profile images of other organisation users", function() {
         nock("https://test-api.opinsys.example")
        .matchHeader("Host", "managertesting.opinsys.net")
        .get("/v3/users/pointyhair/profile.jpg")
        .reply(200, [{ foo: "bar" }]);


        return agent
            .get("/api/puavo/managertesting.opinsys.net/v3/users/pointyhair/profile.jpg")
            .promise()
            .then(function(res) {
                assert.equal(200, res.status, res.text);
            });

    });

});


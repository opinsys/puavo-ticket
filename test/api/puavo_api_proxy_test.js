"use strict";
var helpers = require("../helpers");

var assert = require("assert");

var nock = require('nock');

describe("api.opinsys.fi proxy", function() {

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

    it("GET /api/puavo/v3/devices", function() {
         nock("https://testing.opinsys.fi")
        .get("/v3/devices")
        // XXX: https://github.com/pgte/nock/issues/163
        .matchHeader("Authorization", 'Basic cHVhdm8tdGlja2V0OnBhc3N3b3Jk')
        .reply(200, [
            {
                username: "foo"
            }
        ]);

        return agent
            .get("/api/puavo/v3/devices")
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.deepEqual(res.body, [{"username":"foo"}]);
            });
    });

    it("GET with querystring /api/puavo/v3/devices", function() {
         nock("https://testing.opinsys.fi")
        .get("/v3/devices?foo=bar")
        .matchHeader("Authorization", 'Basic cHVhdm8tdGlja2V0OnBhc3N3b3Jk')
        .reply(200, [
            {
                username: "bar"
            }
        ]);

        return agent
            .get("/api/puavo/v3/devices?foo=bar")
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.deepEqual(res.body, [{"username":"bar"}]);
            });
    });

    it("does not allow mutating requests", function() {
        return agent
            .post("/api/puavo/v3/devices")
            .send({ hostname: "afat" })
            .promise()
            .then(function(res) {
                assert.equal(res.status, 401);
            });
    });

});


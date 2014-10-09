"use strict";
var _ = require("lodash");
var assert = require("assert");
var Promise = require("bluebird");
Promise.longStackTraces();
require("../../utils/superagentPromise");
var request = require("supertest");
var jwt = require("jwt-simple");
var nock = require("nock");

var helpers = require("app/test/helpers");
var app = require("../../server");
var User = require("app/models/server/User");

describe("Authentication", function() {


    it("can get user information after authentication", function() {

        return helpers.clearTestDatabase()
            .then(function() {
                return helpers.loginAsUser(helpers.user.teacher);
            })
            .then(function() {
                return helpers.fetchTestUser();
            })
            .then(function(user) {
                assert.equal(user.get("externalId"), "9324");
                assert.deepEqual(user.get("externalData"), helpers.user.teacher);
            });
    });

    it("can get user updated information after authentication", function() {
        var updatedUser = _.cloneDeep(helpers.user.teacher);
        updatedUser.username = "change.olli.opettaja";
        updatedUser.email = "change.olli.opettaja@testing.opinsys.fi";
        updatedUser.first_name = "changeOlli";
        updatedUser.last_name = "changeOpettaja";

        return helpers.loginAsUser(updatedUser)
            .then(function() {
                return helpers.fetchTestUser();
            })
            .then(function(user) {
                assert.deepEqual(user.get("externalData"), updatedUser);
            });
    });

    it("can get error page when use already exists on the Puavo on the other organisation", function() {
        var userData = _.cloneDeep(helpers.user.teacher);

        userData.iat = Math.round(Date.now() / 1000);

        nock("https://test-api.opinsys.example")
            .matchHeader("Host", "testing.opinsys.fi")
            .get("/v3/users/olli.opettaja")
            .reply(200, [{ username: "olli.opettaja",
                           id: "9324",
                           email: "olli.opettaja@testing.opinsys.fi" }]);

        var agent = request.agent(app);

        return helpers.clearTestDatabase()
            .then(function() {
                User.forge( { externalId: helpers.user.teacher.id,
                              externalData: helpers.user.teacher }).save();
            })
            .then(function() {
                userData.id = "93249324";
                var jwtToken = jwt.encode(userData, "secret");
                return new Promise(function(resolve, reject){
                    agent
                        .get("/?jwt=" + jwtToken)
                        .end(function(err, res) {
                            if (err) return reject(err);
                            assert.equal(res.status, 406, "should get 406");
                            return resolve(agent);
                        });
                });

            });
    });

});

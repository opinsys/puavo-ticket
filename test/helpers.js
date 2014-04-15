"use strict";
/**
 * Various test helpers for the server-side puavo-ticket tests. This should be
 * the first module loaded in each *_test.js file because it setups the proper
 * environment.
 *
 * @namespace test
 * @class helpers
 */

// Ensure testing env
process.env.NODE_ENV = "test";

var Promise = require("bluebird");
var request = require("supertest");
var jwt = require("jwt-simple");

var DB = require("../db");
var config = require("../config");
var app = require("../server");

/**
 * Create a stateful supertest request object (aka agent) which is logged into
 * the puavo-ticket test server. It can access the puavo-ticket rest apis using
 * the permissions it has.
 *
 * See <https://github.com/visionmedia/supertest>
 *
 * @method loginAsUser
 * @static
 * @param {Object} userData
 * @return {Bluebird.Promise} supertest agent instance wrapped in a promise
 */
function loginAsUser(userData){

    userData.iat = Math.round(Date.now() / 1000);
    var jwtToken = jwt.encode(userData, "secret");

    var agent = request.agent(app);

    agent.logout = function() {
        return new Promise(function(resolve, reject){
            agent
            .post("/logout")
            .expect("Location", "/")
            .expect(302)
            .end(function(err, body) {
                if (err) return reject(err);
                return resolve(agent);
            });
        });
    };

    return new Promise(function(resolve, reject){
        agent
        .get("/?jwt=" + jwtToken)
        .expect("Location", "/")
        .expect(302)
        .end(function(err, body) {
            if (err) return reject(err);
            return resolve(agent);
        });
    });
}

/**
 * Ensure empty database for testing
 *
 * @method clearTestDatabase
 * @static
 * @return {Bluebird.Promise}
 */
function clearTestDatabase() {
    return DB.knex.migrate.rollback(config)
        .then(function() {
            return DB.knex.migrate.latest(config);
        });
}

module.exports = {
    loginAsUser: loginAsUser,
    clearTestDatabase: clearTestDatabase,
    user: {
        teacher: {
            "id": "9324",
            "username": "olli.opettaja",
            "first_name": "Olli",
            "last_name": "Opettaja",
            "email": "olli.opettaja@testing.opinsys.fi",
            "organisation_name": "Testing",
            "organisation_domain": "testing.opinsys.fi",
            "primary_school_id": "329",
            "schools": [
                {
                    "id": "234",
                    "dn": "puavoId=1384,ou=Groups,dc=edu,dc=testing,dc=fi",
                    "name": "Jyskä",
                    "abbreviation": "osjys",
                    "roles": [
                        "teacher"
                    ],
                    "groups": [
                        {
                            "id": "79470",
                            "dn": "puavoId=79470,ou=Groups,dc=edu,dc=testing,dc=fi",
                            "name": "Opettajat",
                            "abbreviation": "osjys-opettajat"
                        }
                    ]
                }
            ]
        }
    }
};

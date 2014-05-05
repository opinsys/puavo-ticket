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




var assert = require("assert");
var Promise = require("bluebird");
Promise.longStackTraces();


require("../utils/superagentPromise");
var request = require("supertest");
var jwt = require("jwt-simple");

var DB = require("../db");
var app = require("../server");

var Ticket = require("../models/server/Ticket");
var Comment = require("../models/server/Comment");
var RelatedUser = require("../models/server/RelatedUser");
var User = require("../models/server/User");



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
            .get("/logout")
            .end(function(err, res) {
                if (err) return reject(err);
                assert.equal(res.headers.location, "/");
                assert.equal(res.status, 302);
                return resolve(agent);
            });
        });
    };

    return new Promise(function(resolve, reject){
        agent
        .get("/?jwt=" + jwtToken)
        .end(function(err, res) {
            if (err) return reject(err);
            assert.equal(res.headers.location, "/");
            assert.equal(res.status, 302);
            return resolve(agent);
        });
    });
}

/**
 * Create two test tickets
 *
 * @method insertTestTickets
 * @static
 * @return {Object}
 */
function insertTestTickets() {
    var ticket = Ticket.forge({
        user: 1,
        title: "Test ticket",
        description: "Test ticket with comments, related users etc."
    });

    return ticket.save()
        .then(function() {
            return Comment.forge({
                user: 1,
                ticket: ticket.id,
                updated: 1397727280408,
                comment: "First comment to test ticket"
            })
            .save();
        })
        .then(function() {
            return RelatedUser.forge({
                ticket: ticket.id,
                user_id: 1,
                updated: 1397727280409,
                username: "testuser1"
            })
            .save();
        })
        .then(function() {
            return Comment.forge({
                user: 1,
                ticket: ticket.id,
                updated: 1397727280410,
                comment: "Second comment to test ticket"
            })
            .save();
        })
        .then(function() {
            return Ticket.forge({
                user: 1,
                title: "Other test ticket",
                description: "Other test tickets"
            }).save();
        })
        .then(function(otherTicket) {
            return Comment.forge({
                user: 1,
                ticket: otherTicket.id,
                comment: "First comment to the other ticket"
            })
            .save()
            .then(function() {
                return otherTicket;
            });
        })
        .then(function(otherTicket) {
            return RelatedUser.forge({
                ticket: otherTicket.id,
                user_id: 2,
                username: "testuser2"
            })
            .save()
            .then(function() {
                return otherTicket;
            });
        })
        .then(function(otherTicket) {
            return { ticket: ticket, otherTicket: otherTicket };
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
    var tables = [
        'tickets',
        'comments',
        'visibilities',
        'users',
        'related_users',
        'devices',
        'attachments',
        'followers' ];

    return Promise.all(tables.map(function(table) {
        return DB.knex(table).del();
    }));
}

/**
 * Fetch test user
 *
 *
 * @method fetchTestUser
 * @static
 * @return {Object}
 */
function fetchTestUser() {
    return User.collection()
        .query('where', 'user_id', '=', module.exports.user.teacher.id)
        .fetchOne();
}

module.exports = {
    loginAsUser: loginAsUser,
    clearTestDatabase: clearTestDatabase,
    insertTestTickets: insertTestTickets,
    fetchTestUser: fetchTestUser,

    /**
     * Various Opinsys SSO user JWT tokens
     *
     * @property user
     * @type Object
     */
    user: {
        /**
         * User with teacher permissions in `testing.opinsys.fi` organisation
         *
         * @property user.teacher
         * @type {Object}
         */
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

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
            assert.equal(res.status, 302, "should get redirect after login");
            assert.equal(
                res.headers.location, "/",
                "should have been redirected to front-page after login"
            );
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
function insertTestTickets(user) {
    var ticket = Ticket.forge({
        created_by: user.get("id"),
        title: "Test ticket",
        description: "Test ticket with comments, related users etc."
    });

    return ticket.save()
        .then(function addComment() {
            return Comment.forge({
                created_by: user.get("id"),
                ticket_id: ticket.id,
                updated_at: new Date(),
                comment: "First comment to test ticket"
            })
            .save();
        })
        .then(function addAnotherComment() {
            return Comment.forge({
                created_by: user.get("id"),
                ticket_id: ticket.id,
                updated_at: new Date(),
                comment: "Second comment to test ticket"
            })
            .save();
        })
        .then(function addAnotherTicket() {
            return Ticket.forge({
                created_by: user.get("id"),
                title: "Other test ticket",
                description: "Other test tickets"
            }).save();
        })
        .then(function addCommentToAnotherTicket(otherTicket) {
            return Comment.forge({
                created_by: user.get("id"),
                ticket_id: otherTicket.id,
                comment: "First comment to the other ticket"
            })
            .save()
            .then(function() {
                return otherTicket;
            });
        })
        .then(function returnTicketsObject(otherTicket) {
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
        'comments',
        'visibilities',
        'related_users',
        'devices',
        'attachments',
        'followers',
        'tags',
        'handlers'
 ];

    return Promise.all(tables.map(function(table) {
        return DB.knex(table).del();
    }))
    .then(function() {
        return DB.knex("tickets").del();
    })
    .then(function() {
        return DB.knex("users").del();
    });
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
        .query('where', 'external_id', '=', testUser.teacher.id)
        .fetchOne();
}

/**
 * Various Opinsys SSO user JWT tokens
 *
 * @property user
 * @type Object
 */
var testUser = {
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
    },

    /**
     * Another user with teacher permissions in `testing.opinsys.fi` organisation
     *
     * @property user.teacher2
     * @type {Object}
     */
    teacher2: {
        "id": "400",
        "username": "matti.meikalainen",
        "first_name": "Matti",
        "last_name": "Meikäläinen",
        "email": "matti.meikalainen@testing.opinsys.fi",
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

};

module.exports = {
    loginAsUser: loginAsUser,
    clearTestDatabase: clearTestDatabase,
    insertTestTickets: insertTestTickets,
    fetchTestUser: fetchTestUser,
    user: testUser

};

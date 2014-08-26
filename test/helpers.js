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
process.env.BLUEBIRD_DEBUG = "true";


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
 * @static
 * @method insertTestTickets
 * @param {models.server.User} user User who creates the tickets
 * @return {Object}
 */
function insertTestTickets(user) {
    var ticket;

    return Ticket.create(
            "Test ticket title",
            "Test ticket with comments, related users etc.",
            user
        ).then(function(_ticket) {
            ticket = _ticket;
            return ticket;
        })
        .then(function addComment() {
            return Comment.forge({
                createdById: user.get("id"),
                ticketId: ticket.id,
                updatedAt: new Date(),
                comment: "First comment to test ticket"
            })
            .save();
        })
        .then(function addAnotherComment() {
            return Comment.forge({
                createdById: user.get("id"),
                ticketId: ticket.id,
                updatedAt: new Date(),
                comment: "Second comment to test ticket"
            })
            .save();
        })
        .then(function addAnotherTicket() {
            return Ticket.create(
                "An another ticket",
                 "Other test tickets",
                 user
            );
        })
        .then(function addCommentToAnotherTicket(otherTicket) {
            return Comment.forge({
                createdById: user.get("id"),
                ticketId: otherTicket.id,
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
        'relatedUsers',
        'devices',
        'attachments',
        'followers',
        'tags',
        'handlers',
        'notifications',
        'titles'
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
        .query('where', 'externalId', '=', testUser.teacher.id)
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
    },

    /**
     * Third user with teacher permissions in `testing.opinsys.fi` organisation
     *
     * @property user.teacher3
     * @type {Object}
     */
    teacher3: {
        "id": "403",
        "username": "maija.meikalainen",
        "first_name": "Maija",
        "last_name": "Meikäläinen",
        "email": "maija.meikalainen@testing.opinsys.fi",
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
     * Manager user from managertesting.opinsys.net organisation
     *
     * @property user.manager
     * @type {Object}
     */
    manager: {
        "id": "599",
        "username": "pointyhair",
        "first_name": "Pointy-haired",
        "last_name": "Boss",
        "email": "pointyhair@testing.opinsys.fi",
        "organisation_name": "Manager Testing",
        "organisation_domain": "managertesting.opinsys.net",
        "primary_school_id": "349",
        "schools": [
            {
                "id": "249",
                "dn": "puavoId=249,ou=Groups,dc=edu,dc=managertesting,dc=fi",
                "name": "Administration",
                "abbreviation": "admin",
                "roles": [
                    "manager"
                ],
                "groups": [
                    {
                        "id": "325",
                        "dn": "puavoId=325,ou=Groups,dc=edu,dc=managertesting,dc=fi",
                        "name": "Managers",
                        "abbreviation": "managers"
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

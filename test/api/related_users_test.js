"use strict";
var helpers = require("../helpers");

var assert = require("assert");

describe("/api/tickets/:id/related_users", function() {

    var ticket = null;
    var otherTicket = null;

    before(function() {
        var self = this;

        return helpers.clearTestDatabase()
            .then(function() {
                return helpers.loginAsUser(helpers.user.teacher);
            })
            .then(function(agent) {
                self.agent = agent;

                return helpers.fetchTestUser();
            })
            .then(function(user) {
                self.user = user;

                return helpers.insertTestTickets(user);
            })
            .then(function(tickets) {
                ticket = tickets.ticket;
                otherTicket = tickets.otherTicket;
            });
    });

    after(function() {
        return this.agent.logout();
    });


    it("can add related user to ticket", function() {
        var self = this;
        return this.agent
            .nick("https://testing.opinsys.fi")
            .get("/v3/users/joe.bloggs")
            .reply(200, {
                email: "joe.bloggs@test.com",
                first_name: "Joe",
                last_name: "Bloggs",
                username: "joe.bloggs",
                id: "1432"
            })
            .promise()
            .post("/api/tickets/" + ticket.get("id") + "/related_users")
            .send({
                external_id: "1432"
            })
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                //assert.equal(res.body.username, "testuser");
                assert.equal(res.body.ticket_id, ticket.get("id"));
                assert.equal(res.body.creator_user_id, self.user.id);
            })
            .then(function() {
                return User.forge({ external_id: 400 }).fetch();
            })
            .then(function(related_user) {
                assert.equal(related_user.get("username"), "matti.meikalainen");
            });
    });

    it("can get the related users by ticket", function() {
        return this.agent
            .get("/api/tickets/" + ticket.get("id") + "/related_users")
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(2, res.body.length);
                assert.equal("testuser", res.body[1].username);
            });
    });
});

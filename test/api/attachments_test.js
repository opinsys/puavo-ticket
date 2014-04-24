"use strict";
var helpers = require("../helpers");

var assert = require("assert");


describe("/api/tickets/:id/attachments", function() {

    var ticket = null;
    var otherTicket = null;

    before(function() {
        var self = this;

        return helpers.clearTestDatabase()
            .then(function() {
                return helpers.insertTestTickets();
            })
            .then(function(tickets) {
                ticket = tickets.ticket;
                otherTicket = tickets.otherTicket;

                return helpers.loginAsUser(helpers.user.teacher);
            })
            .then(function(agent) {
                self.agent = agent;
            });
    });

    after(function() {
        return this.agent.logout();
    });


    it("can add attachment to a ticket", function() {
        return this.agent
            .post("/api/tickets/" + ticket.get("id") + "/attachments")
            .set('Content-Type', 'multipart/form-data')
            .attach('attachment', __dirname + "/../test.jpg")
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.deepEqual(res.body, {ok: true});
            });
    });
});

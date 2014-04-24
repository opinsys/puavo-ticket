"use strict";
var helpers = require("../helpers");

var assert = require("assert");
var crypto = require('crypto');


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

    it("can fetch attachments", function() {
        return ticket.attachments().fetch()
            .then(function(attachments) {
                assert.equal(attachments.first().get("filename"), "test.jpg");
                assert.equal(attachments.first().get("data_type"), "image/jpeg");
                assert.equal('7d6f499f5ee89eb34535aa291c69b4ed05ebcffb',
                             crypto
                             .createHash('sha1')
                             .update(attachments.first().get("data"), 'utf8')
                             .digest('hex'));
            });
    });

});

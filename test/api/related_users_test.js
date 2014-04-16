"use strict";
var helpers = require("../helpers");

var assert = require("assert");

var Ticket = require("../../models/server/Ticket");
var RelatedUser = require("../../models/server/RelatedUser");


describe("/api/tickets/:id/related_users", function() {


    var ticket = null;
    var otherTicket = null;
    var relatedUserForOtherTicket = null;

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
            })
            .then(function() {
                relatedUserForOtherTicket = RelatedUser.forge({
                    ticket: otherTicket.id,
                    user_id: 2,
                    username: "testuser2"
                });
                return relatedUserForOtherTicket.save();
            });
    });

    after(function() {
        return this.agent.logout();
    });


    it("can add related user to ticket", function(done) {
        this.agent
        .post("/api/tickets/" + ticket.get("id") + "/related_users")
        .send({
            user_id: 1,
            username: "testuser"
        })
        .expect(200)
        .end(function(err, res) {
            if (err) {
                return done(err);
            }

            assert.equal(res.body.username, "testuser");
            assert.equal(res.body.ticket, ticket.get("id"));
            done();
        });


    });
});

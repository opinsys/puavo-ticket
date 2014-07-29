"use strict";
var helpers = require("../helpers");

var assert = require("assert");
var _ = require("lodash");


describe("/api/tickets/:id/titles", function() {

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


    it("can create new title to ticket", function() {
        var self = this;
        return this.agent
            .post("/api/tickets/" + ticket.get("id") + "/titles")
            .send({
                title: "another test title"
            })
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert.equal(res.body.title, "another test title");
                assert.equal(res.body.ticketId, ticket.get("id"));
                assert.equal(res.body.createdById, self.user.id);
            });
    });

    it("are visible in the tickets api", function() {
        return this.agent
            .get("/api/tickets/" + ticket.get("id"))
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200);
                assert(res.body.titles);
                var title = _.findWhere(res.body.titles, { title: "another test title" });
                assert(title);
                assert(title.createdBy);
                assert.equal("olli.opettaja", title.createdBy.externalData.username);
            });
    });


});

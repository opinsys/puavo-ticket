"use strict";

var assert = require("assert");
var _ = require("lodash");
var Promise = require("bluebird");

var helpers = require("app/test/helpers");
var User = require("app/models/server/User");
var Ticket = require("app/models/server/Ticket");


describe("/api/tickets/:id/titles", function() {

    before(function() {
        var self = this;

        return helpers.clearTestDatabase()
        .then(function() {
            return Promise.join(
                User.ensureUserFromJWTToken(helpers.user.teacher),
                User.ensureUserFromJWTToken(helpers.user.teacher2)
            );
        })
        .spread(function(user, otherUser) {
            self.user = user;
            self.otherUser = otherUser;

            return Promise.join(
                Ticket.create(
                    "Title testing ticket",
                    "foo",
                    self.user
                ),
                Ticket.create(
                    "Other ticket",
                    "bar",
                    self.otherUser
                )
            );
        })
        .spread(function(ticket, otherTicket) {
            self.ticket = ticket;
            self.otherTicket = otherTicket;

            return helpers.loginAsUser(helpers.user.teacher);
        })
        .then(function(agent) {
            self.agent = agent;
        });

    });

    after(function() {
        return this.agent.logout();
    });


    it("can create new title to ticket", function() {
        var self = this;
        return this.agent
            .post("/api/tickets/" + self.ticket.get("id") + "/titles")
            .set("x-csrf-token", self.agent.csrfToken)
            .send({
                title: "another test title"
            })
            .promise()
            .then(function(res) {
                assert.equal(200, res.status, res.text);
                assert.equal(res.body.title, "another test title");
                assert.equal(res.body.ticketId, self.ticket.get("id"));
                assert.equal(res.body.createdById, self.user.id);
            });
    });

    it("are visible in the tickets api", function() {
        var self = this;
        return this.agent
            .get("/api/tickets/" + self.ticket.get("id"))
            .promise()
            .then(function(res) {
                assert.equal(200, res.status, res.text);
                assert(res.body.titles);
                var title = _.findWhere(res.body.titles, { title: "another test title" });
                assert(title);
                assert(title.createdBy);
                assert.equal("olli.opettaja", title.createdBy.externalData.username);
            });
    });

    it("other users cannot set title to other tickets", function() {
        var self = this;

        return self.ticket.addTag("user:" + self.otherUser.get("id"), self.user)
        .then(function() {
            return helpers.loginAsUser(helpers.user.teacher2);
        })
        .then(function(agent) {
            return agent.post("/api/tickets/" + self.ticket.get("id") + "/titles")
            .set("x-csrf-token", agent.csrfToken)
            .send({
                title: "another test title"
            }).promise();
        })
        .then(function(res) {
            assert.equal(403, res.status, res.text);
            assert.equal("permission denied", res.body.error);
        });
    });


});

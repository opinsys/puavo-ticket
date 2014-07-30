"use strict";
var Promise = require("bluebird");
var nodemailer = require("nodemailer");
var sinon = require("sinon");

var helpers = require("../../helpers");

var Ticket = require("../../../models/server/Ticket");
var User = require("../../../models/server/User");
var assert = require("assert");


describe("Ticket email notifications", function() {

    before(function() {
        var self = this;
        return helpers.clearTestDatabase()
            .then(function() {
                return Promise.all([
                    User.ensureUserFromJWTToken(helpers.user.manager),
                    User.ensureUserFromJWTToken(helpers.user.teacher),
                    User.ensureUserFromJWTToken(helpers.user.teacher2)
                ]);
            })
            .spread(function(manager, user, otherUser) {
                self.manager = manager;
                self.user = user;
                self.otherUser = otherUser;
            });
    });

    it("is sent to creator from new comments", function() {
        var self = this;

        var stubTransport = nodemailer.createTransport("stub", {error: false});
        var spy = sinon.spy(stubTransport, "sendMail");

        return Ticket.forge({
                description: "Computer does not work",
                createdById: self.user.get("id")
            }, {
                emailTransport: stubTransport
            })
            .save()
            .then(function(ticket) {
                return ticket.addTitle("A title", self.user, { silent: true })
                    .return(ticket);
            })
            .then(function(ticket) {
                return ticket.addComment("foo", self.otherUser);
            })
            .then(function() {

                assert.equal(1, spy.callCount, "sendMail must be called once");

                assert.equal(
                    spy.lastCall.args[0].to, self.user.getEmail(),
                    "email should have been sent to ticket creator"
                );

                assert.equal(
                    spy.lastCall.args[0].from, "Opinsys support <noreply@opinsys.net>",
                    "mail is sent from noreply address"
                    // we do not support email replies yet
                );

                var body = spy.lastCall.args[0].text;

                assert(
                    /Matti Meikäläinen on lisännyt päivityksen tukipyyntöön "A title" \([0-9]+\)/.test(body),
                    "invalid body: " + body
                );

                assert(
                    /Pääset tarkastelemaan sitä osoitteessa .+/.test(body),
                    "invalid body: " + body
                );

                // TODO: assert subject


            });
    });

    it("is sent to other handlers too as individual emails", function() {
        var self = this;
        var stubTransport = nodemailer.createTransport("stub", {error: false});
        var spy = sinon.spy(stubTransport, "sendMail");

        return Ticket.forge({
                description: "It just doesn't",
                createdById: self.user.get("id")
            }, {
                emailTransport: stubTransport
            })
            .save()
            .then(function(ticket) {
                ticket.addTitle("Computer does not work", self.user, { silent: true });
                return ticket;
            })
            .then(function(ticket) {
                return ticket.addHandler(self.otherUser, self.manager)
                    .then(function() { return ticket; });
            })
            .then(function(ticket) {
                return ticket.addComment("bar", self.manager)
                .then(function(){
                    return ticket;
                });
            })
            .then(function(ticket) {
                assert.equal(
                    2, spy.callCount,
                    "sendMail must be called twice for each handler. Instead got " + spy.callCount
                );
                // TODO: assert email addresses from spy.lastCall.args
            });
    });


    // TODO: test emails from new handlers, related users, devices, ticket state changes

});

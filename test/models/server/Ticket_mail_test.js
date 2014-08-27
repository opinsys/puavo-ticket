"use strict";
var _ = require("lodash");
var Promise = require("bluebird");
var nodemailer = require("nodemailer");
var stubTransport = require("nodemailer-stub-transport");
var sinon = require("sinon");
var assert = require("assert");

var helpers = require("app/test/helpers");
var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");

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

        var transport = nodemailer.createTransport(stubTransport());
        var spy = sinon.spy(transport, "sendMail");

        return Ticket.create(
                "A title",
                "Computer does not work",
                self.user,
                { mailTransport: transport }
            ).then(function(ticket) {
                return ticket.addComment("foo", self.otherUser);
            })
            .then(function() {

                var creatorMail = _.find(spy.args, function(args) {
                    return args[0].to === self.user.getEmail();
                });

                assert(creatorMail, "email should have been sent to ticket creator");


                var body = creatorMail[0].text;

                assert(
                    /Matti Meikäläinen on lisännyt päivityksen tukipyyntöön "A title" \([0-9]+\)/.test(body),
                    "invalid body: " + body
                );

                assert(
                    /Pääset tarkastelemaan tukipyyntöä osoitteessa .+/.test(body),
                    "invalid body: " + body
                );

                // TODO: assert subject

            });
    });

    it("is sent to other handlers too as individual emails", function() {
        var self = this;
        var transport = nodemailer.createTransport(stubTransport());
        var spy = sinon.spy(transport, "sendMail");

        return Ticket.create(
                "Computer does not work",
                "It just doesn't",
                self.user,
                { mailTransport: transport }
            ).then(function(ticket) {
                return ticket.addHandler(
                    self.otherUser,
                    self.manager
                ).return(ticket);
            })
            .then(function(ticket) {
                return ticket.addComment("bar", self.manager).return(ticket);
            })
            .then(function(ticket) {
                assert.equal(
                    2, spy.callCount,
                    "sendMail must be called twice for each handler. Instead got " + spy.callCount
                );
                // TODO: assert email addresses from spy.lastCall.args
            });
    });

    it("is sent to users that are only followers of a ticket", function() {
        var self = this;
        var transport = nodemailer.createTransport(stubTransport());
        var spy = sinon.spy(transport, "sendMail");

        return Ticket.create(
                "Computer does not work",
                "Ticket with follower",
                self.user,
                { mailTransport: transport }
            ).then(function(ticket) {
                return ticket.addFollower(
                    self.otherUser,
                    self.manager
                ).return(ticket);
            })
            .then(function(ticket) {
                return ticket.addComment("bar", self.manager).return(ticket);
            })
            .then(function(ticket) {
                assert.equal(
                    2, spy.callCount,
                    "sendMail must be called twice for each handler. Instead got " + spy.callCount
                );
            });
    });


    // TODO: test emails from new handlers, related users, devices, ticket state changes

});

"use strict";
var Promise = require("bluebird");
var nodemailer = require("nodemailer");
var sinon = require("sinon");
var Moment = require("moment");

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
                title: "Computer does not work",
                description: "It just doesn't",
                created_by: self.user.get("id")
            }, {
                emailTransport: stubTransport
            })
            .save()
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

                // TODO: assert email subject and body from spy.lastCall.args[0].  subject|text
                // https://github.com/andris9/Nodemailer#tldr-usage-example

            });
    });

    it("is sent to other handlers too as individual emails", function() {
        var self = this;
        var stubTransport = nodemailer.createTransport("stub", {error: false});
        var spy = sinon.spy(stubTransport, "sendMail");

        return Ticket.forge({
                title: "Computer does not work",
                description: "It just doesn't",
                created_by: self.user.get("id")
            }, {
                emailTransport: stubTransport
            })
            .save()
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
                    "sendMail must be called twice for each handler"
                );
                assert.equal(
                    spy.args[0][0].subject, "Tiketti " + ticket.get("id") + ": Computer does not work", 
                    "title is not correct"
                );  
                assert.equal
                    (spy.args[0][0].text, 
                    "Tukipyyntöä (" +
                    ticket.get("id") +
                    ") on päivitetty. Pääset katselemaan ja päivittämään sitä tästä linkistä: https://staging-support.opinsys.fi/tickets/" +
                    ticket.get("id") +
                    "\n\n" +
                    self.manager.get("external_data").first_name +
                    " " +
                    self.manager.get("external_data").last_name +
                    ":"+
                    "\n" +
                    "It just doesn't" +
                    "\n\n" + Moment().format('MMM Do H:mm')
                );
                
                // TODO: assert email addresses from spy.lastCall.args
            });
    });


    // TODO: test emails from new handlers, related users, devices, ticket state changes

});

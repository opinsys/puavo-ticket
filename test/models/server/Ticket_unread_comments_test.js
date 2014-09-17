
"use strict";
var Promise = require("bluebird");
var assert = require("assert");

var helpers = require("app/test/helpers");
var Ticket = require("app/models/server/Ticket");
var User = require("app/models/server/User");
var Notification = require("app/models/server/Notification");


describe("Unread comments of a Ticket model", function() {

    before(function() {
        var self = this;
        return helpers.clearTestDatabase()
            .then(function() {
                return Promise.join(
                    User.ensureUserFromJWTToken(helpers.user.teacher),
                    User.ensureUserFromJWTToken(helpers.user.teacher2)
                );
            })
            .spread(function(teacher, otherTeacher) {
                self.teacher = teacher;
                self.otherTeacher = otherTeacher;

                return Promise.join(
                    Ticket.create("A ticket", "Content of the ticket", self.teacher),
                    Ticket.create("Other ticket", "...", self.teacher)
                );
            })
            .map(function(ticket) {
                return ticket.markAsRead(self.teacher).return(ticket);
            })
            .spread(function(ticket, otherTicket) {
                self.ticket = ticket;
                self.otherTicket = otherTicket;

                return self.otherTicket.addComment(
                    "this shoud not interfere with anything",
                    self.otherTeacher
                );
            });
    });

    it("is returned from Ticket#unreadComments({ byEmail: true })", function() {
        var self = this;
        return self.ticket.addComment("a comment", self.otherTeacher)
        .then(function() {
            return self.ticket.unreadComments(self.teacher, { byEmail: true }).fetch();
        })
        .then(function(comments) {
            assert.equal(1, comments.size());
            assert.equal("a comment", comments.first().get("comment"));
        });
    });

    it("is not returned from Ticket#unreadComments({ byEmail: true }) when the email has been sent", function() {
        var self = this;

        return Notification.forge({
            ticketId: self.ticket.get("id"),
            targetId: self.teacher.get("id")
        }).fetch({ require : true })
        .delay(100)
        .then(function(notification) {
            return notification.set("emailSentAt", new Date()).save();
        })
        .then(function() {
            return self.ticket.unreadComments(self.teacher, { byEmail: true }).fetch();
        })
        .then(function(comments) {
            assert.equal(0, comments.size());
            return self.ticket.unreadComments(self.teacher).fetch();
        })
        .then(function(comments) {
            // is still unread
            assert.equal(1, comments.size());
            assert.equal("a comment", comments.first().get("comment"));
        });

    });


});

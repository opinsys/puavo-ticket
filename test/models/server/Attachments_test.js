"use strict";

var helpers = require("../../helpers");

var Attachment = require("../../../models/server/Attachment");
var assert = require("assert");
var fs = require("fs");
var crypto = require('crypto');

describe("Attachment model", function() {

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
                self.ticket = tickets.ticket;
                self.otherTicket = tickets.otherTicket;
            });
    });

    it("Instance can be created", function() {
        var self = this;

        var fileData = fs.readFileSync(__dirname + "/../../test.jpg");

        return Attachment.forge({
                ticketId: self.ticket.id,
                createdById: self.user.id,
                filename: "test.jpg",
                data: fileData
            })
            .save()
            .then(function(attachment) {
                return Attachment.forge({ id: attachment.get("id") }).fetch();
            })
            .then(function(attachment) {
                assert.equal("test.jpg", attachment.get("filename"));
                assert.equal('7d6f499f5ee89eb34535aa291c69b4ed05ebcffb',
                             crypto
                             .createHash('sha1')
                             .update(attachment.get("data"), 'utf8')
                             .digest('hex'));
            });


    });
});

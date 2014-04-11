"use strict";
var setupTestDatabase = require("../setupTestDatabase");

var assert = require("assert");
var app = require("../../server");

var Ticket = require("../../models/server/Ticket");

var request = require("supertest");

describe("/api/tickets/:id/comments", function() {

    var ticket = null;

    before(function() {
        return setupTestDatabase()
	.then(function() {
	    ticket = Ticket.forge({
		title: "Test ticket",
		description: "Test ticket with comments"
	    });
            return ticket.save()
	});
    });


    it("can create new comment to ticket", function(done) {
        request(app)
        .post("/api/tickets/" + ticket.get("id") + "/comments")
        .send({
            comment: "test comment for ticket",
        })
        .expect(200)
        .end(function(err, res) {
            if (err) {
                return done(err);
            }

            assert.equal(res.body.comment, "test comment for ticket");
            done();
        });

    });


});

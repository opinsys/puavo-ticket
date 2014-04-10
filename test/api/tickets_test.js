"use strict";
var setupTestDatabase = require("../setupTestDatabase");

var assert = require("assert");
var app = require("../../server");

var request = require("supertest");

describe("/api/tickets", function() {

    before(function() {
        return setupTestDatabase();
    });

    it("can create a ticket using POST", function(done) {
        request(app)
        .post("/api/tickets")
        .send({
            title: "Computer does not work",
            description: "It just doesnt"
        })
        .expect(200)
        .end(function(err, res) {
            if (err) {
                return done(err);
            }

            assert.equal(res.body.title, "Computer does not work");
            assert(res.body.id, "has id");
            done();
        });

    });

    it("can get the ticket using GET", function(done) {
        request(app)
        .get("/api/tickets")
        .expect(200)
        .end(function(err, res) {
            if (err) {
                return done(err);
            }
            assert.equal(1, res.body.length);
            assert.equal(1, res.body[0].id);
            assert.equal("Computer does not work", res.body[0].title);
            done();
        });
    });

    it("can get single ticket using GET", function(done) {
        request(app)
        .get("/api/tickets/1")
        .expect(200)
        .end(function(err, res) {
            if (err) {
                return done(err);
            }
            assert.equal(1, res.body.id);
            assert.equal("Computer does not work", res.body.title);
            done();
        });
    });

    it("can update ticket using PUT", function(done) {
        request(app)
        .put("/api/tickets/1")
        .send({
            title: "updated ticket",
            description: "It just doesnt"
        })
        .expect(200)
        .end(function(err, res) {
            if (err) {
                return done(err);
            }

            assert.equal(
                res.body.title,
                "updated ticket",
                "Responds with updated ticket data"
            );
            assert(res.body.id, "has id");
            done();
        });
    });

    it("can get updated ticket using GET", function(done) {
        request(app)
        .get("/api/tickets/1")
        .expect(200)
        .end(function(err, res) {
            if (err) {
                return done(err);
            }
            assert.equal(1, res.body.id);
            assert.equal("updated ticket", res.body.title);
            done();
        });
    });

});

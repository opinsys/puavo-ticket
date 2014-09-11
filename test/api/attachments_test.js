"use strict";

var Promise = require("bluebird");
var assert = require("assert");
var _ = require("lodash");
var fs = require("fs");

var helpers = require("app/test/helpers");
var User = require("app/models/server/User");
var Ticket = require("app/models/server/Ticket");

var TEST_IMAGE_PATH = __dirname + "/../test.jpg";
var TEST_IMAGE_DATA = fs.readFileSync(TEST_IMAGE_PATH);

describe("/api/tickets/:ticketId/comments/:commentId/attachments", function() {

    before(function() {
        var self = this;
        return helpers.clearTestDatabase()
            .then(function() {
                return Promise.join(
                    User.ensureUserFromJWTToken(helpers.user.manager),
                    User.ensureUserFromJWTToken(helpers.user.teacher),
                    User.ensureUserFromJWTToken(helpers.user.teacher2)
                );
            })
            .spread(function(manager, teacher, otherTeacher) {
                self.manager = manager;
                self.teacher = teacher;
                self.otherTeacher = otherTeacher;

                return Promise.join(
                    Ticket.create(
                        "The Ticket",
                        "Will get notifications (first comment)",
                        self.teacher
                    ),
                    helpers.loginAsUser(helpers.user.teacher)
                );
            })
            .spread(function(ticket, agent) {
                self.ticket = ticket;
                self.agent = agent;

                return self.ticket.addComment("comment with attachments", self.teacher);
            })
            .then(function(comment) {
                self.comment = comment;
            });
    });

    after(function() {
        return this.agent.logout();
    });


    it("can add attachment to a ticket", function() {
        var self = this;
        return this.agent
            .post("/api/tickets/" + self.ticket.get("id") + "/comments/" + this.comment.get("id") + "/attachments")
            .set('Content-Type', 'multipart/form-data')
            .attach("file1", TEST_IMAGE_PATH)
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200, res.text);
                // one file was added
                assert.equal(1, res.body.length);
                var fileRes = res.body[0];

                // has id
                assert(fileRes.id);

                assert.equal("test.jpg", fileRes.filename);
                assert.equal("image/jpeg", fileRes.dataType);
                assert.equal(TEST_IMAGE_DATA.length, fileRes.size);

            });
    });

    it("adds attachment information to ticket details api", function() {
        var self = this;
        return self.agent.get("/api/tickets/" + self.ticket.get("id"))
            .promise()
            .then(function(res) {
                assert.equal(res.status, 200, res.text);
                // has two comments
                var comment = _.find(res.body.comments, { comment: "comment with attachments" });
                assert(comment, "has the comment");

                assert(comment.attachments, "has attachments relation loaded");

                // has one attachment
                assert.equal(1, comment.attachments.length);

                var attachment = comment.attachments[0];

                // response has filename
                assert.equal("test.jpg", attachment.filename);

                // response has file type
                assert.equal("image/jpeg", attachment.dataType);

                // response has file type
                assert.equal("image/jpeg", attachment.dataType);

                assert(attachment.id, "has id prop");

                // Has file size
                assert.equal(TEST_IMAGE_DATA.length, attachment.size);


                self.attachment = attachment;
            });
    });

    it("can fetch attachment data by id", function() {
        var self = this;
        return this.agent
            .get("/api/tickets/" +
                  self.ticket.get("id") +
                  "/comments/" + this.comment.get("id") +
                  "/attachments/" + self.attachment.id + "/" +
                  self.attachment.filename
             ).promise()
             .then(function(res) {
                assert.equal(200, res.status, res.text);

                assert.equal("image/jpeg", res.headers["content-type"]);
                assert.equal(TEST_IMAGE_DATA.length, res.headers["content-length"]);
                assert.equal(TEST_IMAGE_DATA.toString(), res.text);
             });
    });


});

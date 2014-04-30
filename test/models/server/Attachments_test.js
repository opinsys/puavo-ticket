"use strict";

var helpers = require("../../helpers");

var Attachment = require("../../../models/server/Attachment");
var assert = require("assert");
var fs = require("fs");
var crypto = require('crypto');

describe("Attachment model", function() {

    before(function() {
        return helpers.clearTestDatabase();
    });

    it("Instance can be created", function() {
        var fileData = fs.readFileSync(__dirname + "/../../test.jpg");

        return Attachment.forge({
                ticket: 1,
                user: 1,
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

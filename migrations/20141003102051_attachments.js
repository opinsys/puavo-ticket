'use strict';

var Attachment = require("app/models/server/Attachment");

/**
 * Add fileId column to attachments table.
 *
 * This makes it possible to add file to GridSQL before the comment owning the
 * attachment is created. It is needed to stream email attachments. In email
 * attachments the file may come before we know which comment owns it.
 */
exports.up = function(knex, Promise) {
    return knex.schema.table("attachments", function (table) {
        table.string("fileId");
    })
    .then(function() {
        return Attachment.collection().fetch();
    })
    .then(function(coll) { return coll.models; })
    .map(function(attachment) {
        return attachment.set({
            fileId: attachment.getComputedFileId()
        }).save();
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table("attachments", function (table) {
        table.dropColumn("fileId");
    });
};

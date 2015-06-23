'use strict';

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
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table("attachments", function (table) {
        table.dropColumn("fileId");
    });
};

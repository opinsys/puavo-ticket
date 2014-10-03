"use strict";

/**
 * Use emailArchive table as the email review queue too
 *
 * Add state column indicating the state of the archived email.
 *
 * Possible values
 *
 *   - It is pending for a review
 *   - It is rejected (spam)
 *   - It is accepted and a comment is created from it
 *
 */
exports.up = function(knex, Promise) {
    // When pending the comment is not created yet so it must be null
    return knex.raw('alter table "emailArchive" alter "commentId" drop not null')
    .then(function() {
        return knex.schema.table("emailArchive", function(table) {
            table.dateTime("createdAt").notNullable();
            table.integer("state").defaultTo(1).notNullable();
        });
    });
};

exports.down = function(knex, Promise) {
    return knex.raw('alter table "emailArchive" alter "commentId" set not null')
    .then(function() {
        return knex.schema.table("emailArchive", function(table) {
            table.dropColumn("createdAt");
            table.dropColumn("state");
        });
    });
};

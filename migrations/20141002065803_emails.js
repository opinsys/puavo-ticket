"use strict";

exports.up = function(knex, Promise) {
    return Promise.join(
        // Secret for email reply checking
        knex.schema.table("tickets", function (table) {
            table.string("emailSecret");
        }),

        // Archive for the raw received emails
        knex.schema.createTable("emailArchive", function(table) {
            table.json("email").notNullable();
            table.integer("commentId")
                .unique()
                .notNullable()
                .references("id")
                .inTable("comments");
        })
    );
};


exports.down = function(knex, Promise) {
    return Promise.join(
        knex.schema.table("tickets", function (table) {
            table.dropColumn("emailSecret");
        }),
        knex.schema.dropTable("emailArchive")
    );
};

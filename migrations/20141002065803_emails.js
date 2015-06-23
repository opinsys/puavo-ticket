"use strict";


exports.up = function(knex, Promise) {
    return Promise.join(
        // We wont be using this field. We will use jsonb or separate emails
        // table
        knex.schema.table("users", function (table) {
            table.dropColumn("email");
        }),

        // Secret for email reply checking
        knex.schema.table("tickets", function (table) {
            table.string("emailSecret").notNullable().defaultTo("changeme");
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
        knex.schema.table("users", function (table) {
            table.string("email").unique();
        }),
        knex.schema.dropTable("emailArchive")
    );
};

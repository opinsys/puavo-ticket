'use strict';

exports.up = function(knex, Promise) {
    return knex.schema.table("comments", function(table) {
        table.boolean("hidden").notNullable().defaultTo(false);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.table("comments", function(table) {
        table.dropColumn("hidden");
    });
};

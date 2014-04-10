"use strict";

exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTable("tickets", function(table) {
            table.increments("id");
            table.string("title");
            table.string("description");
            table.dateTime("created");
            table.dateTime("updated");
        }),

        knex.schema.createTable("comments", function(table) {
            table.increments("id");
            table.string("comment");
            table.string("username");
            table.dateTime("created");
            table.dateTime("updated");
            table.integer("ticket");
        }),

        knex.schema.createTable("visibilities", function(table) {
            table.increments("id");
            table.string("comment");
            table.integer("entity");
            table.string("entity_type");
            table.dateTime("created");
            table.dateTime("updated");
            table.integer("ticket");
        }),

    ]);
};

exports.down = function(knex, Promise) {

};

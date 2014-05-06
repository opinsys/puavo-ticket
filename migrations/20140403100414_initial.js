"use strict";

exports.up = function(knex, Promise) {
    return knex.schema.createTable("users", function(table) {
        table.increments("id");
        table.integer("external_id").notNullable();
        table.string("username");
        table.string("first_name");
        table.string("last_name");
        table.string("email");
        table.string("organisation_domain").notNullable();
        table.json("external_data");
        table.dateTime("created");
        table.dateTime("updated");
    })
    .then(function() {
        return knex.schema.createTable("tickets", function(table) {
            table.increments("id");
            table.string("title");
            table.string("description");
            table.integer("user_id")
                .notNullable()
                .references("id")
                .inTable('users');
            table.dateTime("created");
            table.dateTime("updated");
        });
    })
    .then(function() {
        return Promise.all([
            knex.schema.createTable("comments", function(table) {
                table.increments("id");
                table.string("comment").notNullable();
                table.integer("user_id")
                    .notNullable()
                    .references("id")
                    .inTable('users');
                table.dateTime("created");
                table.dateTime("updated");
                table.integer("ticket_id").notNullable();
            }),

            knex.schema.createTable("visibilities", function(table) {
                table.increments("id");
                table.string("comment");
                table.string("entity");
                table.dateTime("created");
                table.dateTime("updated");
                table.integer("ticket_id").notNullable();
            }),

            knex.schema.createTable("related_users", function(table) {
                table.increments("id");
                table.integer("external_id");
                table.string("username");
                table.integer("user_id")
                    .references("id")
                    .inTable('users');
                table.dateTime("created");
                table.dateTime("updated");
                table.integer("ticket_id").notNullable();
            }),

            knex.schema.createTable("devices", function(table) {
                table.increments("id");
                table.string("hostname").notNullable();
                table.integer("user_id")
                    .notNullable()
                    .references("id")
                    .inTable('users');
                table.integer("ticket_id").notNullable();
                table.dateTime("created");
                table.dateTime("updated");
            }),

            knex.schema.createTable("attachments", function(table) {
                table.increments("id");
                table.binary("data").notNullable();
                table.string("data_type");
                table.string("filename");
                table.integer("user_id")
                    .notNullable()
                    .references("id")
                    .inTable('users');
                table.integer("ticket_id")
                    .notNullable()
                    .references("id")
                    .inTable('tickets');
                table.dateTime("created");
                table.dateTime("updated");
            }),

            knex.schema.createTable("followers", function(table) {
                table.increments("id");
                table.integer("user_id")
                    .notNullable()
                    .references("id")
                    .inTable('users');
                table.integer("ticket_id");
                table.dateTime("created");
                table.dateTime("updated");
            })
        ]);
    });
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable("tickets"),
        knex.schema.dropTable("comments"),
        knex.schema.dropTable("visibilities"),
        knex.schema.dropTable("users"),
        knex.schema.dropTable("related_users"),
        knex.schema.dropTable("devices"),
        knex.schema.dropTable("attachments"),
        knex.schema.dropTable("followers")
    ]);
};

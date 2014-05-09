"use strict";

/**
 * Add owner relation
 */
function addOwnerRelation(table) {
    return table.integer("creator_user_id")
        .notNullable()
        .references("id")
        .inTable("users");
}

function addTicketRelation(table) {
    return table.integer("ticket_id")
        .notNullable()
        .references("id")
        .inTable("tickets");
}

exports.up = function(knex, Promise) {
    return knex.schema.createTable("users", function(table) {
        table.increments("id");
        table.string("external_id").notNullable().unique();
        table.json("external_data");
        table.dateTime("created");
        table.dateTime("updated");
    })
    .then(function createTicketsTable() {
        return knex.schema.createTable("tickets", function(table) {
            addOwnerRelation(table);
            table.increments("id");
            table.string("title");
            table.string("description");
            table.dateTime("created");
            table.dateTime("updated");
            table.dateTime("deleted_at");
        });
    })
    .then(function createTicketRelationTables() {
        return Promise.all([
            knex.schema.createTable("comments", function(table) {
                addOwnerRelation(table);
                addTicketRelation(table);
                table.increments("id");
                table.string("comment").notNullable();
                table.dateTime("created");
                table.dateTime("updated");
                table.dateTime("deleted_at");
            }),

            knex.schema.createTable("visibilities", function(table) {
                addOwnerRelation(table);
                addTicketRelation(table);
                table.increments("id");
                table.string("comment");
                table.string("entity");
                table.dateTime("created");
                table.dateTime("updated");
                table.dateTime("deleted_at");
            }),

            knex.schema.createTable("related_users", function(table) {
                addOwnerRelation(table);
                addTicketRelation(table);
                table.increments("id");
                table.integer("external_id");
                table.string("username");
                table.dateTime("created");
                table.dateTime("updated");
                table.dateTime("deleted_at");
            }),

            knex.schema.createTable("devices", function(table) {
                addOwnerRelation(table);
                addTicketRelation(table);
                table.increments("id");
                table.string("hostname").notNullable();
                table.string("external_id");
                table.dateTime("created");
                table.dateTime("updated");
                table.dateTime("deleted_at");
            }),

            knex.schema.createTable("attachments", function(table) {
                addOwnerRelation(table);
                addTicketRelation(table);
                table.increments("id");
                table.binary("data").notNullable();
                table.string("data_type");
                table.string("filename");
                table.dateTime("created");
                table.dateTime("updated");
                table.dateTime("deleted_at");
            }),

            knex.schema.createTable("followers", function(table) {
                addOwnerRelation(table);
                addTicketRelation(table);
                table.increments("id");
                table.dateTime("created");
                table.dateTime("updated");
                table.dateTime("deleted_at");
            }),

            knex.schema.createTable("tags", function(table) {
                addOwnerRelation(table);
                addTicketRelation(table);
                table.string("tag");
                table.increments("id");
                table.dateTime("created");
                table.dateTime("updated");
                table.dateTime("deleted_at");
                addDeletedBy(table);
            })
        ]);
    });
};

exports.down = function(knex, Promise) {

    return Promise.all([
        knex.schema.dropTableIfExists("comments"),
        knex.schema.dropTableIfExists("visibilities"),
        knex.schema.dropTableIfExists("related_users"),
        knex.schema.dropTableIfExists("devices"),
        knex.schema.dropTableIfExists("attachments"),
        knex.schema.dropTableIfExists("followers"),
        knex.schema.dropTableIfExists("tags")
    ])
    .then(function() {
        return knex.schema.dropTableIfExists("tickets");
    })
    .then(function() {
        return knex.schema.dropTableIfExists("users");
    });
};

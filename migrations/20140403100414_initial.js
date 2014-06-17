"use strict";

function addLifecycleColumns(table) {
    table.integer("created_by")
        .notNullable()
        .references("id")
        .inTable("users");

    table.integer("deleted_by")
        .references("id")
        .inTable("users");

    table.dateTime("created_at").notNullable();
    table.dateTime("updated_at").notNullable();
    table.dateTime("deleted_at");

    // A helper column for the uniqueForTicket constraints. Null value
    // in the delete_at field won't work as one would expect.
    // See http://stackoverflow.com/a/5834554
    //
    // "deleted" column  defaults to 0 and when the Model is soft deleted it is
    // set as the id of the Model (See models.server.Base#softDelete). Using this
    // uniqueForTicket constraint can ensure that only one columnName can be in
    // non soft deleted state.
    table.integer("deleted").defaultTo(0).notNullable();
}

function uniqueForTicket(table, columnName) {
    table.unique(["ticket_id", "deleted"].concat(columnName));
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
        table.json("external_data").notNullable();
        table.dateTime("created_at").notNullable();
        table.dateTime("updated_at").notNullable();
    })
    .then(function createTicketsTable() {
        return knex.schema.createTable("tickets", function(table) {
            addLifecycleColumns(table);
            table.increments("id");
            table.text("title");
            table.text("description");
        });
    })
    .then(function createTicketRelationTables() {
        return Promise.all([
            knex.schema.createTable("comments", function(table) {
                addLifecycleColumns(table);
                addTicketRelation(table);

                table.increments("id");
                table.text("comment").notNullable();
            }),

            knex.schema.createTable("visibilities", function(table) {
                addLifecycleColumns(table);
                addTicketRelation(table);

                table.increments("id");
                table.string("comment");
                table.string("entity").notNullable();
                uniqueForTicket(table, "entity");
            }),

            knex.schema.createTable("related_users", function(table) {
                addLifecycleColumns(table);
                addTicketRelation(table);

                table.increments("id");
                table.integer("user")
                    .notNullable()
                    .references("id")
                    .inTable("users");

                uniqueForTicket(table, "user");
            }),

            knex.schema.createTable("handlers", function(table) {
                addLifecycleColumns(table);
                addTicketRelation(table);

                table.increments("id");
                table.integer("handler")
                    .notNullable()
                    .references("id")
                    .inTable("users");

                uniqueForTicket(table, "handler");
            }),

            knex.schema.createTable("devices", function(table) {
                addLifecycleColumns(table);
                addTicketRelation(table);

                table.increments("id");
                table.string("hostname").notNullable();
                table.string("external_id");
            }),

            knex.schema.createTable("attachments", function(table) {
                addLifecycleColumns(table);
                addTicketRelation(table);

                table.increments("id");
                table.binary("data").notNullable();
                table.string("data_type");
                table.string("filename");
            }),

            knex.schema.createTable("followers", function(table) {
                addLifecycleColumns(table);
                addTicketRelation(table);

                // TODO: add user relation
                table.increments("id");
            }),

            knex.schema.createTable("tags", function(table) {
                addLifecycleColumns(table);
                addTicketRelation(table);

                table.string("tag").notNullable();
                table.increments("id");
                uniqueForTicket(table, "tag");
            }),

            knex.schema.createTable("readTickets", function(table) {
                addTicketRelation(table);
                table.integer("readById")
                    .notNullable()
                    .references("id")
                    .inTable("users");

                table.increments("id");
                table.dateTime("readAt");
                table.boolean("unread");
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
        knex.schema.dropTableIfExists("tags"),
        knex.schema.dropTableIfExists("handlers"),
        knex.schema.dropTableIfExists("readTickets")
    ])
    .then(function() {
        return knex.schema.dropTableIfExists("tickets");
    })
    .then(function() {
        return knex.schema.dropTableIfExists("users");
    });
};

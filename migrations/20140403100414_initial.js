"use strict";

function addLifecycleColumns(table) {
    table.integer("createdById")
        .notNullable()
        .references("id")
        .inTable("users");

    table.integer("deletedById")
        .references("id")
        .inTable("users");

    table.dateTime("createdAt").notNullable();
    table.dateTime("updatedAt").notNullable();
    table.dateTime("deletedAt");

    // A helper column for the uniqueForTicket constraints. Null value
    // in the deleteAt field won't work as one would expect.
    // See http://stackoverflow.com/a/5834554
    //
    // "deleted" column  defaults to 0 and when the Model is soft deleted it is
    // set as the id of the Model (See models.server.Base#softDelete). Using
    // this the uniqueForTicket constraint can ensure that only one columnName
    // can be in non soft deleted state.
    table.integer("deleted").defaultTo(0).notNullable();
}

function uniqueForTicket(table, columnName) {
    table.unique(["ticketId", "deleted"].concat(columnName));
}

function addTicketRelation(table) {
    return table.integer("ticketId")
        .notNullable()
        .references("id")
        .inTable("tickets");
}

exports.up = function(knex, Promise) {
    return knex.schema.createTable("users", function(table) {
        table.increments("id");
        table.string("externalId").notNullable().unique();
        table.json("externalData").notNullable();
        table.dateTime("createdAt").notNullable();
        table.dateTime("updatedAt").notNullable();
    })
    .then(function createTicketsTable() {
        return knex.schema.createTable("tickets", function(table) {
            addLifecycleColumns(table);
            table.increments("id");
        });
    })
    .then(function createTicketRelationTables() {
        return Promise.all([
            knex.schema.createTable("titles", function(table) {
                addLifecycleColumns(table);
                addTicketRelation(table);

                table.increments("id");
                table.text("title").notNullable();
            }),

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

            knex.schema.createTable("relatedUsers", function(table) {
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
                table.string("externalId");
            }),

            knex.schema.createTable("attachments", function(table) {
                addLifecycleColumns(table);
                addTicketRelation(table);

                table.increments("id");
                table.binary("data").notNullable();
                table.string("dataType");
                table.string("filename");
            }),

            knex.schema.createTable("followers", function(table) {
                table.increments("id");
                addLifecycleColumns(table);
                addTicketRelation(table);
                table.integer("followedById")
                    .notNullable()
                    .references("id")
                    .inTable("users");

                uniqueForTicket(table, "followedById");
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
        knex.schema.dropTableIfExists("titles"),
        knex.schema.dropTableIfExists("comments"),
        knex.schema.dropTableIfExists("visibilities"),
        knex.schema.dropTableIfExists("relatedUsers"),
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

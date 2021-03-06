"use strict";

var addLifecycleColumns = require("app/utils/migrationHelpers").addLifecycleColumns;
var addTicketRelation = require("app/utils/migrationHelpers").addTicketRelation;
var uniqueForTicket = require("app/utils/migrationHelpers").uniqueForTicket;

exports.up = function(knex, Promise) {
    return knex.schema.createTable("users", function(table) {
        table.increments("id");
        table.string("email").unique();
        table.string("externalId").unique();
        table.json("externalData");
        table.dateTime("createdAt").notNullable();
        table.dateTime("updatedAt").notNullable();
    })
    .then(function createTicketsTable() {
        return knex.schema.createTable("tickets", function(table) {
            addLifecycleColumns(table);
            table.increments("id");
            table.string("zendeskTicketId").unique();
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
                table.text("textType").defaultTo("plain").notNullable();
                table.string("zendeskCommentId").unique();
            }),

            knex.schema.createTable("visibilities", function(table) {
                addLifecycleColumns(table);
                addTicketRelation(table);

                table.increments("id");
                table.string("comment");
                table.string("entity").notNullable();
                uniqueForTicket(table, "entity");
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

            knex.schema.createTable("attachments", function(table) {
                addLifecycleColumns(table);

                table.integer("commentId")
                    .notNullable()
                    .references("id")
                    .inTable("comments");

                table.increments("id");
                table.string("filename").notNullable();
                table.integer("size").notNullable();
                table.integer("chunkCount").defaultTo(0).notNullable();
                table.string("dataType");
            }),

            // Save files to separate chunks table instead of incorporating them
            // in to the attachments table. This makes backups a little bit
            // easier and adds possibility to actually save the attachments in
            // chunks to multiple chunks rows which would make possible to
            // stream the files.
            //
            // Currently we just save the files in to a single chunk which has
            // obvious memory and performance limitations.
            knex.schema.createTable("chunks", function(table) {
                table.string("fileId").notNullable();
                table.binary("chunk").notNullable();
                table.integer("sequence").defaultTo(1).notNullable();
                table.unique(["fileId", "sequence"]);
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

            knex.schema.createTable("notifications", function(table) {
                table.increments("id");
                addTicketRelation(table);
                table.integer("targetId")
                    .notNullable()
                    .references("id")
                    .inTable("users");
                table.unique(["ticketId", "targetId"]);

                table.dateTime("readAt").notNullable();
                table.dateTime("emailSentAt").notNullable();
            })

        ]);
    });
};

exports.down = function(knex, Promise) {

    var tables = [
        "chunks",
        "titles",
        "attachments",
        "comments",
        "visibilities",
        "followers",
        "tags",
        "handlers",
        "notifications",
        "tickets",
        "users",
    ];

    function drop(tables) {
        if (tables.length === 0) return Promise.resolve();
        return knex.schema.dropTableIfExists(tables[0])
        .then(function() {
            return drop(tables.slice(1));
        });
    }

    return drop(tables);

};

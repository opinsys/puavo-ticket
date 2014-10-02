"use strict";

var Ticket = require("app/models/server/Ticket");

exports.up = function(knex, Promise) {
    return Promise.join(
        // Secret for email reply checking
        knex.schema.table("tickets", function (table) {
            table.string("emailSecret").notNullable().defaultTo("changeme");
        })
        .then(function() {
            return Ticket.collection().fetch();
        })
        .then(function(coll) { return coll.models; })
        .map(function(ticket) {
            return ticket.set({ emailSecret: Ticket.generateSecret() }).save();
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

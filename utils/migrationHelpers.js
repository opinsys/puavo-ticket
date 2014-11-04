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

module.exports = {
    addLifecycleColumns: addLifecycleColumns,
    uniqueForTicket: uniqueForTicket,
    addTicketRelation: addTicketRelation
};

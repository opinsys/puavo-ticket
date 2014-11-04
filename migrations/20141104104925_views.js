'use strict';

var addLifecycleColumns = require("app/utils/migrationHelpers").addLifecycleColumns;

exports.up = function(knex, Promise) {
    return knex.schema.createTable("views", function(table) {
        table.increments("id");
        addLifecycleColumns(table);
        table.json("query").notNullable();
        table.string("name").notNullable();
        table.unique(["name", "createdById"]);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTable("views");
};

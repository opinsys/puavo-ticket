'use strict';

var addLifecycleColumns = require("app/utils/migrationHelpers").addLifecycleColumns;


exports.up = function(knex, Promise) {
    return knex.schema.createTable("accessTags", function(table) {
        table.increments("id");
        addLifecycleColumns(table);
        table.integer("userId")
            .notNullable()
            .references("id")
            .inTable("users");
        table.string("tag").notNullable();
        table.unique(["tag", "createdById", "deleted"]);
    });
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists("accessTags");
};

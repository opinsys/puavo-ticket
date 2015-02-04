'use strict';

var addLifecycleColumns = require("app/utils/migrationHelpers").addLifecycleColumns;
var User = require("../models/server/User");
var Visibility = require("../models/server/Visibility");

function migrateData() {
    return User.collection().fetch()
    .then(function(c) {
        console.log("Adding accessTags for", c.size(), "users");
        return c.models;
    })
    .each(function(user) {
        var tag = "user:" + user.get("id");
        return user.addAccessTag(tag, user);
    })
    .then(function() {
        return Visibility.collection()
        .query(function(q) {
            q.where("entity", "like", "user:%");
        })
        .fetch({
            withRelated: "ticket"
        });
    })
    .then(function(c) {
        console.log("Adding tags for", c.size(), "tickets");
        return c.models;
    })
    .each(function(vis) {
        var tag = vis.get("entity");
        return vis.rel("ticket").addTag(tag, vis.get("createdById"));
    });
}

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
    })
    .then(migrateData);
};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists("accessTags");
};

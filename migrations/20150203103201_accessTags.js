'use strict';

var addLifecycleColumns = require("app/utils/migrationHelpers").addLifecycleColumns;
var User = require("../models/server/User");
var Visibility = require("../models/server/Visibility");

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
    .then(function() {
        return User.collection().fetch();
    })
    .then(function(c) {
        return c.models;
    })
    .each(function(user) {
        return user.addAccessTag("user:" + user.get("id"));
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
        return c.models;
    })
    .each(function(vis) {
        var tag = vis.get("entity");
        console.log("Add ticket tag", tag);
        return vis.rel("ticket").addTag(tag, vis.get("createdById"));
    });

};

exports.down = function(knex, Promise) {
    return knex.schema.dropTableIfExists("accessTags");
};

"use strict";

require("../");
require("../db");

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

if (require.main === module) {
    migrateData()
    .then(function() {
        console.log("ok");
        process.exit(1);
    })
    .catch(function(err) {
        console.error(err);
        process.exit(1);
    });
}

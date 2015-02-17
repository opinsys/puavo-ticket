"use strict";

require("../");
require("../db");

var User = require("../models/server/User");
var Visibility = require("../models/server/Visibility");

var i = 0;
var size = 0;

function migrateData() {
    return User.collection().fetch()
    .then(function(c) {
        console.log("Adding accessTags for", c.size(), "users");
        size = c.size();
        return c.models;
    })
    .map(function(user) {
        var tag = "user:" + user.get("id");
        if (++i % 100 === 0) console.log(i, "/", size,  "accessTag", tag);
        return user.addAccessTag(tag, user);
    }, {concurrency:5})
    .then(function() {
        console.log("Done. Fetching visibilities...");
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
        i = 0;
        size = c.size();
        return c.models;
    })
    .map(function(vis) {
        var tag = vis.get("entity");
        if (++i % 100 === 0) console.log(i, "/", size,  "tag", tag);
        return vis.rel("ticket").addTag(tag, vis.get("createdById"));
    }, {concurrency:5});
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

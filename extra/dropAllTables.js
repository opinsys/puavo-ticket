"use strict";
var db = require("app/db");

var tables = db.tables.concat("knex_migrations");

db.knex.raw('DROP TABLE IF EXISTS ' + tables.map(function(t) {
    return '"' + t + '"';
}).join(",") + ' CASCADE')
.then(function(ok) {
    console.log("Dropped", tables);
    process.exit(0);
})
.catch(function(err) {
    process.nextTick(function() {
        throw err;
    });
});

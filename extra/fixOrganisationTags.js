"use strict";
/*
 * Ensure `.opinsys.fi`for each organisation: style tag
 **/


var db = require("../db");

db.knex("tags")
.where({deleted: 0})
.where("tag", "like", "organisation:%")
.where("tag", "not like", "organisation:%.opinsys.fi")
.then(function(res) {
    return res;
})
.each(function(row) {
    return db.knex("tags").where({id: row.id}).update({
        tag: row.tag + ".opinsys.fi"
    }).catch(function(err) {
        console.error(row.ticketId, row.tag, err.message);
    });
})
.catch(function(err) {
    console.error(err);
    process.exit(1);
})
.then(function() {
    process.exit();
});

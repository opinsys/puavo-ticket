"use strict";


// We not want to run this by accident. Comment this out when you use this but
// do not commit it
process.exit(1);

var DB = require("app/db");
/**
 * Delete all rows from given tables in series.
 *
 * The rows must have an id sequence which will be restarted
 *
 * @static
 * @private
 * @method deleteAndReset
 * @param {Array} tables Tables names
 */
function deleteAndReset(tables) {
    if (tables.length === 0) return;

    var tableName = tables[0];

    return DB.knex(tableName).del()
    .then(function() {
        return DB.knex.raw("ALTER SEQUENCE \"" + tableName + "_id_seq\" RESTART");
    })
    .then(function() {
        return deleteAndReset(tables.slice(1));
    });
}

/**
 * Ensure empty database for testing
 *
 * @static
 * @method clearTestDatabase
 * @return {Bluebird.Promise}
 */
function deleteAllTickets() {
    // the chunks table has no incrementing id column
    return DB.knex("chunks").del()
    .then(function() {
        return deleteAndReset([
            "attachments",
            "comments",
            "visibilities",
            "followers",
            "tags",
            "handlers",
            "notifications",
            "titles",
            "tickets",
        ]);
    });
}

deleteAllTickets()
.then(function() {
    console.log("done");
    process.exit();
})
.catch(function(err) {
    console.log(err);
    console.log(err.stack);
    process.exit(1);
});

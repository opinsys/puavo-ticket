"use strict";
var GridSQL = require("./utils/GridSQL");
var Bookshelf = require("bookshelf");
var config = require("./config");
var knex = require("knex");

var knex = knex(config.database);
var db = Bookshelf.initialize(knex);
Bookshelf.DB = db;
Bookshelf.DB.plugin("virtuals");
Bookshelf.DB.gridSQL = new GridSQL({
    knex: knex,
    // chunkSize: 1024
    // chunkSize: 1024 * 1024
    // chunkSize: 1025 * 1024 * 4
    // chunkSize: 1025 * 1024 * 10
    chunkSize: 1024 * 255
});

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

    return db.knex(tableName).del()
    .then(function() {
        return db.knex.raw("ALTER SEQUENCE \"" + tableName + "_id_seq\" RESTART");
    })
    .then(function() {
        return deleteAndReset(tables.slice(1));
    });
}


db.tables = [
    "accessTags",
    "views",
    "chunks",
    "emailArchive",
    "attachments",
    "comments",
    "visibilities",
    "followers",
    "tags",
    "handlers",
    "notifications",
    "titles",
    "tickets",
    "users"
];

/**
 * Ensure empty database
 *
 * @static
 * @method emptyAllRows
 * @return {Bluebird.Promise}
 */
db.emptyAllRows = function() {
    // the chunks table has no incrementing id column
    return Bookshelf.DB.knex("chunks").del()
    .then(function() {
        return deleteAndReset(db.tables.filter(function(t) {
            return t !== "chunks";
        }));
    });
};

module.exports = Bookshelf.DB;


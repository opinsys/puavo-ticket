var initDb = require("../db");
var Bookshelf = require("bookshelf");
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));

var config = require("../config");

function setupTestDatabase() {
    // Remove existing database file
    return fs.unlinkAsync(config.database.connection.filename)
        .catch(function() {
            console.log("no db file");
        })
        .then(function() {
            return Bookshelf.DB.knex.migrate.latest(config);
        })
        .then(function() {
            console.log("migrate ok");
            initDb();
        });
}


module.exports = setupTestDatabase;

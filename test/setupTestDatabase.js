"use strict";
var DB = require("../db");
var config = require("../config");

function setupTestDatabase() {
    return DB.knex.migrate.rollback(config)
        .then(function() {
            return DB.knex.migrate.latest(config);
        });
}


module.exports = setupTestDatabase;

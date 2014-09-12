"use strict";
var GridSQL = require("./utils/GridSQL");
var Bookshelf = require("bookshelf");
var config = require("./config");
var knex = require("knex");

var knex = knex(config.database);
Bookshelf.DB = Bookshelf.initialize(knex);
Bookshelf.DB.plugin("virtuals");
Bookshelf.DB.gridSQL = new GridSQL({
    knex: knex,
    // chunkSize: 1024
    // chunkSize: 1024 * 1024
    // chunkSize: 1025 * 1024 * 4
    // chunkSize: 1025 * 1024 * 10
    chunkSize: 1024 * 255
});
module.exports = Bookshelf.DB;


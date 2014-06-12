"use strict";
var Bookshelf = require("bookshelf");
var config = require("./config");
var knex = require("knex");
Bookshelf.DB = Bookshelf.initialize(knex(config.database));
Bookshelf.DB.plugin("virtuals");
module.exports = Bookshelf.DB;


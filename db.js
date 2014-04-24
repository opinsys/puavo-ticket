"use strict";
var Bookshelf = require("bookshelf");
var config = require("./config");
Bookshelf.DB = Bookshelf.initialize(config.database);
Bookshelf.DB.plugin("virtuals");
module.exports = Bookshelf.DB;


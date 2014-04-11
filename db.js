"use strict";
var Bookshelf = require("bookshelf");
var config = require("./config");
Bookshelf.DB = Bookshelf.initialize(config.database);
module.exports = Bookshelf.DB;


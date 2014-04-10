"use strict";
var Bookshelf = require("bookshelf");
var config = require("./config");
function init() {
    Bookshelf.DB = Bookshelf.initialize(config.database);
}
init();
module.exports = init;


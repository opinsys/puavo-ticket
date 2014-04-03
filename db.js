var Bookshelf = require("bookshelf");
var config = require("./config");
module.exports = Bookshelf.DB = Bookshelf.initialize(config.database);



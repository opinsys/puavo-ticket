
"use strict";

require("../../db");
var Base = require("./Base");

/**
 * 
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class Chunk
 */
var Chunk = Base.extend({

    tableName: "chunks",

});

module.exports = Chunk;

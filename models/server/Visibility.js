"use strict";
require("../../db");
var Bookshelf = require("bookshelf");

var Visibility = Bookshelf.DB.Model.extend({

    tableName: "visibilities",

    defaults: function() {
        return {
            created_at: new Date(),
            updated_at: new Date()
        };
    }

});

module.exports = Visibility;

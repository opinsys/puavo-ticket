"use strict";
require("../../db");
var Bookshelf = require("bookshelf");

var User = require("./User");

var Visibility = Bookshelf.DB.Model.extend({

    tableName: "visibilities",

    defaults: function() {
        return {
            created_at: new Date(),
            updated_at: new Date()
        };
    },

    createdBy: function() {
        return this.belongsTo(User, "created_by");
    }

});

module.exports = Visibility;

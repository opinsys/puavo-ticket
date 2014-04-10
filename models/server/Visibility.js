"use strict";
require("../../db");
var Bookshelf = require("bookshelf");

var Visibility = Bookshelf.DB.Model.extend({

  tableName: "visibilities",

  defaults: function() {
      return {
          created: new Date(),
          updated: new Date()
      };
  }

});

module.exports = Visibility;

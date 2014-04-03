
var Bookshelf = require("bookshelf");

var Comment = Bookshelf.DB.Model.extend({

  tableName: "comments",

  defaults: function() {
      return {
          created: new Date(),
          updated: new Date()
      };
  }

});

module.exports = Comment;

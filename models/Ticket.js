
var Bookshelf = require("bookshelf");
var Comment = require("./Comment");

var Ticket = Bookshelf.DB.Model.extend({
    tableName: "tickets",

    defaults: function() {
        return {
            created: new Date(),
            updated: new Date()
        };
    },

    comments: function() {
        return this.hasMany(Comment, "ticket");
    }

});


module.exports = Ticket;

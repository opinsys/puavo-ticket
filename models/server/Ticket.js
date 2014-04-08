
var Bookshelf = require("bookshelf");
var Comment = require("./Comment");
var _ = require("lodash");

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
    },

    addComment: function(comment) {
        return Comment.forge(_.extend({}, comment, {
            ticket: this.get("id"),
        })).save();
    }

});


module.exports = Ticket;

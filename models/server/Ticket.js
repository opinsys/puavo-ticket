
var Bookshelf = require("bookshelf");
var Comment = require("./Comment");
var Visibility = require("./Visibility");
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

    visibilities: function() {
        return this.hasMany(Visibility, "ticket");
    },

    addVisibility: function(visibility) {
        return Visibility.forge(_.extend({}, visibility, {
            ticket: this.get("id"),
        })).save();
    },

    addComment: function(comment) {
        return Comment.forge(_.extend({}, comment, {
            ticket: this.get("id"),
        })).save();
    }

});


module.exports = Ticket;

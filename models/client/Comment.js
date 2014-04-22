"use strict";
var Base = require("./Base");


function commentUrl(ticketId) {
    return "/api/tickets/" + ticketId + "/comments";
}

/**
 * Client Comment model
 *
 * @namespace models.client
 * @class Comment
 * @extends models.client.Base
 * @uses models.TicketMixin
 */
var Comment = Base.extend({

    url: function() {
        return commentUrl(this.collection.ticketId);
    }

});

module.exports = Comment;

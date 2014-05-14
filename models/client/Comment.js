"use strict";
var Base = require("./Base");


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
        return this.collection.ticket.url() + "/comments";
    }

});

module.exports = Comment;

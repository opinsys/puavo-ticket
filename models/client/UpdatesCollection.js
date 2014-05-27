"use strict";
var Base = require("./Base");
var Comment = require("./Comment");
var Device = require("./Device");
var Tag = require("./Tag");
var Handler = require("./Handler");


var MODEL = {
    tags: Tag,
    comments: Comment,
    devices: Device,
    handlers: Handler
};


/**
 *
 * Client-side collection if ticket comments
 *
 * @namespace models.client
 * @class UpdatesCollection
 * @extends models.client.Base.Collection
 */
var UpdatesCollection = Base.Collection.extend({


    initialize: function(models, opts) {
        if (opts && opts.ticket) this.setTicket(opts.ticket);
    },

    setTicket: function(ticket) {
        this.ticket = ticket;
    },

    model: function(attrs, options) {
        var Model = MODEL[attrs.type];
        if (!Model) {
            throw new Error("Unknown update type: " + attrs.type);
        }
        return new Model(attrs, options);
    },

    url: function() {
        if (!this.ticket.get("id")) {
            throw new Error("Cannot fetch comments without ticket id!");
        }
        return "/api/tickets/" + this.ticket.get("id") + "/updates";
    }

});

module.exports = UpdatesCollection;

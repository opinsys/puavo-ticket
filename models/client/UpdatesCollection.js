"use strict";
var Base = require("./Base");
var Comment = require("./Comment");
var Device = require("./Device");


function updateUrl(ticketId) {
    return "/api/tickets/" + ticketId + "/updates";
}

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
        if (opts && opts.ticketId) this.ticketId = opts.ticketId;
    },

    model: function(attrs, options) {
        if (attrs.hostname) {
            return new Device(attrs, options);
        }

        return new Comment(attrs, options);
    },

    url: function() {
        if (!this.ticketId) {
            throw new Error("Cannot fetch comments without ticketId!");
        }
        return updateUrl(this.ticketId);
    }

});

module.exports = UpdatesCollection;

"use strict";
var Base = require("./Base");
var Comment = require("./Comment");
var Device = require("./Device");
var Tag = require("./Tag");


var MODEL = {
    tags: Tag,
    comments: Comment,
    devices: Device
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
        if (opts && opts.ticketId) this.ticketId = opts.ticketId;
    },

    model: function(attrs, options) {
        var Model = MODEL[attrs.type];
        if (!Model) {
            throw new Error("Unknown update type: " + attrs.type);
        }
        return new Model(attrs, options);
    },

    url: function() {
        if (!this.ticketId) {
            throw new Error("Cannot fetch comments without ticketId!");
        }
        return "/api/tickets/" + this.ticketId + "/updates";
    }

});

module.exports = UpdatesCollection;

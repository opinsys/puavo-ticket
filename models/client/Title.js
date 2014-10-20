"use strict";
var _ = require("lodash");

var Base = require("./Base");
var UpdateMixin = require("./UpdateMixin");

/**
 * Client Title model
 *
 * @namespace models.client
 * @class Title
 * @extends models.client.Base
 * @uses models.TicketMixin
 */
var Title = Base.extend({

    defaults: function() {
        return {
            type: "titles",
            createdAt: new Date().toString()
        };
    },

    url: function() {
        return this.parent.url() + "/titles";
    },

}, {

    collection: function(models, options, modelOptions) {
        var previousTitle = "";
        models = models.map(function(data) {
            var newData = _.extend({}, data, {previousTitle: previousTitle});
            previousTitle = data.title;
            return newData;
        });

        return Base.collection.call(this, models, options, modelOptions);
    }

});

_.extend(Title.prototype, UpdateMixin);
module.exports = Title;

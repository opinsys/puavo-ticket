"use strict";

var Cocktail = require("backbone.cocktail");

var Base = require("./Base");
var TagMixin = require("../TagMixin");

/**
 * Client Tag model
 *
 * @namespace models.client
 * @class Tag
 * @extends models.client.Base
 * @uses models.TagMixin
 */
var Tag = Base.extend({

    url: function() {
        return this.collection.ticket.url() + "/tags";
    }

});

Cocktail.mixin(Tag, TagMixin);
module.exports = Tag;

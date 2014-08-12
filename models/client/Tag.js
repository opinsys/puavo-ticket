"use strict";
var _ = require("lodash");
var Cocktail = require("backbone.cocktail");

var UpdateMixin = require("./UpdateMixin");
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

    defaults: function() {
        return {
            type: "tags",
            createdAt: new Date().toString()
        };
    },

    url: function() {
        return this.parent.url() + "/tags";
    }

});

Cocktail.mixin(Tag, TagMixin);
_.extend(Tag.prototype, UpdateMixin);
module.exports = Tag;

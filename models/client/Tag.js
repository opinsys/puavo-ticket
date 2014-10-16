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
        var u = this.parent.url() + "/tags";
        if (this.isNew()) return u;
        return u + "/" + this.get("tag");
    }

});

Cocktail.mixin(Tag, TagMixin);
_.extend(Tag.prototype, UpdateMixin);
module.exports = Tag;

"use strict";

var Base = require("./Base");

/**
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class AccessTag
 */
var AccessTag = Base.extend({

    tableName: "accessTags",

    defaults: function() {
        return {
            createdAt: new Date(),
            updatedAt: new Date()
        };
    },


});

module.exports = AccessTag;

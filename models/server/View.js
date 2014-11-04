"use strict";

var Base = require("./Base");


/**
 *
 * Custom ticket list view
 *
 * @namespace models.server
 * @extends models.server.Base
 * @class View
 */
var View = Base.extend({

    tableName: "views",

    defaults: function() {
        return {
            createdAt: new Date(),
            updatedAt: new Date()
        };
    },


});

module.exports = View;

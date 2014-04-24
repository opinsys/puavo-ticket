"use strict";

var Bookshelf = require("bookshelf");


/**
 * Base class for server Models
 *
 * @namespace models.server
 * @extends Bookshelf.Model
 * @class Base
 */
var Base = Bookshelf.DB.Model.extend({

    virtuals: {
        /**
         * Virtual database field. Use .get("unique_id") to access it.
         *
         * This string id is unique between all tables. We need this to be able
         * to put models of diffent type to a single Backbone collection
         *
         * @property unique_id
         * @type String
         */
        unique_id: function() {
            return this.constructor.prototype.tableName + ":" + this.id;
        },
    }
});

module.exports = Base;

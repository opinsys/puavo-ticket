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
         * Unique id between tables.
         *
         * Virtual database field. Use .get("unique_id") to access it.
         *
         * @property unique_id
         * @type String
         */
        unique_id: function() {
            if (!this.id) return;
            return this.get("type") + ":" + this.id;
        },

        /**
         * The database table name
         *
         * Virtual database field. Use .get("type") to access it.
         *
         * @property type
         * @type String
         */
        type: function() {
            return this.constructor.prototype.tableName;
        }
    }
});

module.exports = Base;

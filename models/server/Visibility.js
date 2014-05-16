"use strict";
require("../../db");
var Bookshelf = require("bookshelf");

var User = require("./User");

var Visibility = Bookshelf.DB.Model.extend({

    tableName: "visibilities",

    defaults: function() {
        return {
            created_at: new Date(),
            updated_at: new Date()
        };
    },

    createdBy: function() {
        return this.belongsTo(User, "created_by");
    }

}, {

    /**
     * Visibility assertion helper
     *
     * @method hasVisibility
     * @param {String} visibility
     * @param {Array} models Array of models.server.Visibility models
     * @return Boolean
     */
    hasVisibility: function(visibility, models){
        var visibilities = models.map(function(v) {
            return v.get("entity");
        });

        return visibilities.indexOf(visibility) !== -1;
    }

});

module.exports = Visibility;

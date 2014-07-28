"use strict";
require("../../db");

var User = require("./User");
var Base = require("./Base");

var Visibility = Base.extend({

    tableName: "visibilities",

    defaults: function() {
        return {
            createdAt: new Date(),
            updatedAt: new Date()
        };
    },

    createdBy: function() {
        return this.belongsTo(User, "createdById");
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

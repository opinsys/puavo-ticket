"use strict";

var Backbone = require("backbone");

/**
 * User model for Opinsys user JWT tokens.
 *
 * There is no database presentation of this model. This must instantiated with
 * with JWT token data.
 *
 * https://api.opinsys.fi/v3/sso/developers
 *
 * This model can be used on both server and the client.
 *
 * @namespace models
 * @class User
 */
var User = Backbone.Model.extend({

    getVisibilities: function() {
        var visibilities = [
            "user:" + this.get("id"),
            "organisation:" + this.get("organisation_domain")
        ];

        visibilities = visibilities.concat(this.get("schools").map(function(school) {
            return "school:" + school.id;
        }));

        return visibilities;
    }

});



module.exports = User;

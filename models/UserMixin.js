"use strict";

/**
 * UserSession model for Opinsys user JWT tokens.
 *
 * There is no database presentation of this model. This must instantiated with
 * with JWT token data.
 *
 * https://api.opinsys.fi/v3/sso/developers
 *
 * This model can be used on both server and the client.
 *
 * @namespace models
 * @class UserSession
 */
var UserMixin = {

    /**
     * Get visibility strings for the user
     *
     * @method getVisibilities
     * @return {Array} Array of visibility strings. Eg organisation:testing.opinsys.fi
     */
    getVisibilities: function() {
        var visibilities = [
            "user:" + this.get("id"),
            "organisation:" + this.get("organisation_domain")
        ];

        visibilities = visibilities.concat(this.get("schools").map(function(school) {
            return "school:" + school.id;
        }));

        return visibilities;
    },

    /**
     * @method getProfileImage
     * @return {String} url to the profile image
     */
    getProfileImage: function() {
         return "/api/puavo/v3/users/" + this.get("username") + "/profile.jpg";
    },

};



module.exports = UserMixin;

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
     * @method getPersonalVisibility
     * @return {String}
     */
    getPersonalVisibility: function(){
        return "user:" + this.get("id");
    },

    /**
     * @method getOrganisationVisibility
     * @return {String}
     */
    getOrganisationVisibility: function(){
        return "organisation:" + this.get("organisation_domain");
    },

    /**
     * Get visibility strings for the user
     *
     * @method getVisibilities
     * @return {Array} Array of visibility strings. Eg organisation:testing.opinsys.fi
     */
    getVisibilities: function() {
        var visibilities = [
            this.getPersonalVisibility(),
            this.getOrganisationVisibility(),
        ];

        // XXX: restore after schools has been added to the db
        // visibilities = visibilities.concat(this.get("schools").map(function(school) {
        //     return "school:" + school.id;
        // }));

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

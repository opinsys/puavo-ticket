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
 * @class UserMixin
 */
var UserMixin = {


    /**
     * @method getPersonalVisibility
     * @return {String}
     */
    getPersonalVisibility: function(){
        if (!this.get("id")) throw new Error("Cannot get visibility before save");
        return "user:" + this.get("id");
    },

    /**
     * @method getOrganisationVisibility
     * @return {String}
     */
    getOrganisationVisibility: function(){
        return "organisation:" + this.getOrganisationDomain();
    },

    /**
     * Returned in User#getVisibilities() if the user is an organisation admin
     *
     * @method getOrganisationAdminVisibility
     * @return {String}
     */
    getOrganisationAdminVisibility: function(){
        return "organisationadmin:" + this.getOrganisationDomain();
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

        // XXX: add getOrganisationAdminVisibility if the user is organisation admin

        // XXX: add organisationmanager visibility if the user is an opinsys employee

        // XXX: restore after schools has been added to the db
        // visibilities = visibilities.concat(this.get("schools").map(function(school) {
        //     return "school:" + school.id;
        // }));

        return visibilities;
    },

    /**
     * @method getOrganisationDomain
     * @return {String}
     */
    getOrganisationDomain: function(){
        return this.get("externalData").organisation_domain;
    },

    /**
     * WARNING this is not unique between different organisations in
     * puavo-ticket. Use User#getDomainUsername() when possible.
     *
     * @method getUsername
     * @return {String}
     */
    getUsername: function(){
        return this.get("externalData").username;
    },

    /**
     * @method getDomainUsername
     * @return {String}
     */
    getDomainUsername: function() {
        return this.getUsername() + "@" + this.getOrganisationDomain();
    },

    /**
     * @method getExternalId
     * @return {String}
     */
    getExternalId: function() {
        return String(this.get("externalData").id);
    },

    /**
     * @method getEmail
     * @return {String}
     */
    getEmail: function(){
        return this.get("externalData").email;
    },

    /**
     *
     * @method getFullname
     * @return {String}
     */
    getFullname: function(){
        var data = this.get("externalData");
        if (!data) return "";
        return data.first_name + " " + data.last_name;
    },

    /**
     * @method getProfileImage
     * @return {String} url to the profile image
     */
    getProfileImage: function() {
        // FIXME: call getProfileImagen after ticket loading (TicketView:133)
        if (this.get("externalData")) {
            return "/api/puavo/v3/users/" + this.get("externalData").username + "/profile.jpg";
        }
    },

};



module.exports = UserMixin;

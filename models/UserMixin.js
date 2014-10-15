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
        if (this.isEmailOnly()) return null;
        return this.getUsername() + "@" + this.getOrganisationDomain();
    },

    /**
     * @method getExternalId
     * @return {String}
     */
    getExternalId: function() {
        var externalId = this.get("externalId");
        if (externalId) return externalId;

        var externalData = this.get("externalData");
        externalId = externalData && externalData.id;
        if (externalId) return externalId;

        return null;
    },

    /**
     * Return the primary email
     *
     * @method getEmail
     * @return {String}
     */
    getEmail: function(){
        return this.get("externalData").email;
    },

    /**
     * @method getAlternativeEmails
     * @return {Array} Array of email addresses
     */
    getAlternativeEmails: function() {
        // TODO
        return [];
    },

    /**
     *
     * @method getFullName
     * @return {String}
     */
    getFullName: function(){
        var data = this.get("externalData");
        if (!data) return "";
        return (data.first_name + " " + data.last_name).trim();
    },

    /**
     * @method getFirstName
     * @return {String}
     */
    getFirstName: function(){
        var data = this.get("externalData");
        if (!data) return "";
        return data.first_name;
    },

    /**
     * @method getLastName
     * @return {String}
     */
    getLastName: function(){
        var data = this.get("externalData");
        if (!data) return "";
        return data.last_name;
    },

    /**
     * @method getAlphabeticName
     * @return {String}
     */
    getAlphabeticName: function(){
        var data = this.get("externalData");
        if (!data) return "";
        return (data.last_name + ", " + data.first_name).trim();
    },

    /**
     * Get human readable organisation name
     *
     * @method getOrganisationName
     */
    getOrganisationName: function(){
        if (this.isEmailOnly()) return "Email only";
        return this.get("externalData").organisation_name;
    },

    /**
     * @method getProfileImage
     * @return {String} url to the profile image
     */
    getProfileImage: function() {
        if (this.get("externalData")) {
            return [
                "/api/puavo/",
                this.getOrganisationDomain(),
                "/v3/users/",
                this.get("externalData").username,
                "/profile.jpg"
            ].join("");
        } else {
            return "/images/anonymous.jpg";
        }
    },

    /**
     * @method getSchools
     * @return {Array} of school objects
     */
    getSchools: function(){
        var data = this.get("externalData");
        return (data && data.schools) || [];
    },

    /**
     * @method getPrimarySchoolId
     * @return {String}
     */
    getPrimarySchoolId: function(){
        return this.get("externalData").primary_school_id;
    },

    /**
     * @method getPrimarySchool
     * @return {Object}
     */
    getPrimarySchool: function(){
        var id = this.getPrimarySchoolId();
        return this.getSchools().filter(function(school) {
            return school.id === id;
        })[0];
    },

    /**
     * Return true for users that have not ever logged in puavo-ticket and have
     * used it only via email
     *
     * @method isEmailOnly
     * @return {Boolean}
     */
    isEmailOnly: function(){
        return this.getExternalId() === null;
    },


    /**
     * @method getPuavoEditURL
     * @return {String}
     */
    getPuavoEditURL: function() {
        return [
            "https://",
            this.getOrganisationDomain(),
            "/users/",
            this.getPrimarySchoolId(),
            "/users/",
            this.getExternalId(),
            "/edit"
        ].join("");
    },

    /**
     * @method isPuavoUser
     * @return {Boolean}
     */
    isPuavoUser: function(){
        return !!this.getExternalId();
    },

    toString: function() {
        return "<User " + this.getDomainUsername() + " (" + this.get("id") + ")>";
    }

};



module.exports = UserMixin;

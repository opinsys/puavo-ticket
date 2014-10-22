"use strict";


/**
 * Isomorphic Acl engine which can be use on the server and the client.
 *
 * On client use to hide/show components and on the server restrict api access
 * accordingly.
 *
 * @namespace models
 * @class Acl
 * @constructor
 * @param {models.client.User|models.server.User} user
 */
function Acl(user) {
    this.user = user;
}


function PermissionDeniedError(message) {
    this.message = message;
}
PermissionDeniedError.prototype = new Error();

Acl.prototype = {

    /**
     * @property PermissionDeniedError
     * @type {Error}
     */
    PermissionDeniedError: PermissionDeniedError,

    /**
     * @method canEditTags
     * @param {models.client.Ticket|models.server.Ticket} ticket
     * @return {Boolean}
     */
    canEditTags: function(ticket) {
        return this.user.isManager();
    },

    /**
     * @method canChangeStatus
     * @param {models.client.Ticket|models.server.Ticket} ticket
     * @return {Boolean}
     */
    canChangeStatus: function(ticket) {
        if (this.user.isManager()) return true;
        return ticket.isHandler(this.user);
    },

    /**
     * Whether user can edit a given tag
     *
     * @method canEditTag
     * @param {models.client.Ticket|models.server.Ticket} ticket
     * @param {models.server.Tag|models.client.Tag} tag
     * @return {Boolean}
     */
    canEditTag: function(ticket, tag){
        if (tag.isStatusTag()) {
            return this.canChangeStatus(ticket);
        } else {
            return this.canEditTags(ticket);
        }
    },

    /**
     * @method canEditHandlers
     * @param {models.client.Ticket|models.server.Ticket} ticket
     * @return {Boolean}
     */
    canEditHandlers: function(ticket) {
        // Only manager can edit handlers
        return this.user.isManager();
    },

    /**
     * On zendesk imported images display the zendesk link
     *
     * @method canSeeZendeskLink
     * @param {models.client.Ticket|models.server.Ticket} ticket
     * @return {Boolean}
     */
    canSeeZendeskLink: function(ticket) {
        return this.user.isManager();
    },

    /**
     * Can follow or unfollow tickets
     *
     * @method canFollow
     * @param {models.client.Ticket|models.server.Ticket} ticket
     * @return {Boolean}
     */
    canFollow: function(ticket) {
        // All users can follow any ticket they can see but the ticket creator
        // cannot stop following they've created
        return ticket.get("createdById") !== this.user.get("id");
    },

    /**
     * @method canEditTitle
     * @param {models.client.Ticket|models.server.Ticket} ticket
     * @return {Boolean}
     */
    canEditTitle: function(ticket){
        if (this.user.isManager()) return true;
        return ticket.isHandler(this.user);
    },

    /**
     * Skips visibility check for ticket list queries
     *
     * @method canSeeAllTickets
     * @return {Boolean}
     */
    canSeeAllTickets: function() {
        return this.user.isManager();
    },

    /**
     * Skips visibility check for ticket list queries
     *
     * @method canSeeAllTickets
     * @return {Boolean}
     */
    canUseCustomViews: function() {
        return this.user.isManager();
    },

    /**
     * Display tickets without a handler in the notifications box
     *
     * @method canSeeAllTickets
     * @return {Boolean}
     */
    canSeePendingTickets: function() {
        return this.user.isManager();
    },

    /**
     * Whether the user can access puavo api for the given organisation domain
     *
     * @method canAccessOrganisation
     * @param {String} organisationDomain
     * @return {Boolean}
     */
    canAccessOrganisation: function(organisationDomain) {
        // Managers can access any organisation data
        if (this.user.isManager()) return true;

        // Other can only access their own organisation data
        return this.user.getOrganisationDomain() === organisationDomain;
    },

};

/**
 * @static
 * @property PermissionDeniedError
 * @type {Error}
 */
Acl.PermissionDeniedError = PermissionDeniedError;

module.exports = Acl;

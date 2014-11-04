"use strict";

var _ = require("lodash");

/**
 *
 * @class TicketMixin
 * @namespace models
 */
var TicketMixin = {

    /**
     * @method hasTag
     * @param {String} tag
     * @return {Boolen}
     */
    hasTag: function(tag){
        return this.rel("tags").some(function(tagOb) {
            return !tagOb.isSoftDeleted() && tagOb.get("tag") === tag;
        });
    },

    toString: function() {
        return "<Ticket " + this.get("id") + ">";
    },

    /**
     * Get ticket status using the updates relation. Ticket updates must be
     * fetched with `this.updates().fetch() for this to work.
     *
     * @method getCurrentStatus
     * @return {String}
     */
    getCurrentStatus: function() {

        var statusTags = this.rel("tags").filter(function(tag) {
            return tag.isStatusTag() && !tag.get("deletedAt");
        });

        if (statusTags.length === 0) {
            return null;
        }

        return _.max(statusTags,  function(update) {
            return update.createdAt().getTime();
        }).getStatus();
    },

};

module.exports = TicketMixin;

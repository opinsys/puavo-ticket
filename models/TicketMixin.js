"use strict";

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

};

module.exports = TicketMixin;

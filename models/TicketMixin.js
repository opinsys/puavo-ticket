"use strict";

/**
 *
 * @class TicketMixin
 * @namespace models
 */
var TicketMixin = {

    /**
     * Bar method
     *
     * @method methodFromMixin
     */
    methodFromMixin: function() {
    
    },

    toString: function() {
        return "<Ticket " + this.get("id") + ">";
    },

};

module.exports = TicketMixin;

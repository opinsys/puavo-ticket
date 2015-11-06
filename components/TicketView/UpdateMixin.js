"use strict";
var React = require("react");
var Base = require("../../models/client/Base");

/**
 * Common functionality for each ticket update component
 *
 * @namespace components
 * @class TicketView.UpdateMixin
 * @constructor
 * @param {Object} props
 * @param {models.client.Base} props.update
 */
var UpdateMixin = {

    propTypes: {
        update: React.PropTypes.instanceOf(Base).isRequired
    },

    /**
     * Get update creator name for the update
     *
     * @method getCreatorName
     * @return {String}
     */
    getCreatorName: function() {
        if (this.props.update.createdBy) {
            var createdBy = this.props.update.createdBy();
            if (!createdBy) return "Unknown";
            return createdBy.getFullName();
        }
        return "Unknown";
    },
};

module.exports = UpdateMixin;

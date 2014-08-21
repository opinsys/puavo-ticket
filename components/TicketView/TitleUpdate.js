
/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

var OnViewportMixin = require("../OnViewportMixin");
var UpdateMixin = require("./UpdateMixin");
var Base = require("../../models/client/Base");

/**
 * TitleUpdate
 *
 * @namespace components
 * @class TicketView.TitleUpdate
 * @uses components.TicketView.UpdateMixin
 * @uses components.OnViewportMixin
 *
 * @constructor
 * @param {Object} props
 * @param {models.client.Base} props.update
 */
var TitleUpdate = React.createClass({
    mixins: [UpdateMixin, OnViewportMixin],

    propTypes: {
        update: React.PropTypes.instanceOf(Base).isRequired,
    },

    render: function() {
        return (
            <div className="TitleUpdate ticket-update small">
                <span className="description">
                    {this.getCreatorName()} vaihtoi otsikon:
                </span>
                <span className="new-title">
                    {this.props.update.get("title")}
                </span>
            </div>
        );
    }
});


module.exports = TitleUpdate;

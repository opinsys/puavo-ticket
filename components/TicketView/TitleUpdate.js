
/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var OverlayTrigger = require("react-bootstrap/OverlayTrigger");
var Tooltip = require("react-bootstrap/Tooltip");

var OnViewportMixin = require("../OnViewportMixin");
var UpdateMixin = require("./UpdateMixin");
var Base = require("../../models/client/Base");
var StringDiff = require("../StringDiff");

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
        var previousTitle = this.props.update.get("previousTitle");
        var title = this.props.update.get("title");
        return (
            <div className="TitleUpdate ticket-update small">
                <span className="description">
                    {this.getCreatorName()} vaihtoi otsikoksi
                </span>
                <OverlayTrigger placement="top" overlay={
                    <Tooltip>
                        <StringDiff previous={previousTitle} next={title} />
                    </Tooltip>
                    }>
                    <span className="new-title">{title}</span>
                </OverlayTrigger>
            </div>
        );
    }
});


module.exports = TitleUpdate;

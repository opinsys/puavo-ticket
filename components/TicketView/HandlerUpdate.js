/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var classSet = React.addons.classSet;

var OnViewportMixin = require("../OnViewportMixin");
var UpdateMixin = require("./UpdateMixin");

/**
 * Render ticket handler change update
 *
 * @namespace components
 * @class TicketView.HandlerUpdate
 * @uses components.TicketView.UpdateMixin
 * @uses components.OnViewportMixin
 */
var HandlerUpdate = React.createClass({
    mixins: [UpdateMixin, OnViewportMixin],

    render: function() {
        var className = classSet({
            HandlerUpdate: true,
            "ticket-update": true,
            small: true,
            deleted: this.props.update.isSoftDeleted()
        });

        return (
            <div className={className}>
                <i>{this.getCreatorName()} lisäsi käsittelijäksi käyttäjän </i>
                <span>{this.props.update.getUser().getFullName()}</span>
            </div>
        );
    },
});


module.exports = HandlerUpdate;

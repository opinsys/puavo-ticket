/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

var OnViewportMixin = require("../OnViewportMixin");
var UpdateMixin = require("./UpdateMixin");

/**
 * Render ticket handler change update
 *
 * @namespace components
 * @class HandlerUpdate
 * @uses components.TicketView.UpdateMixin
 * @uses components.OnViewportMixin
 */
var HandlerUpdate = React.createClass({
    mixins: [UpdateMixin, OnViewportMixin],

    render: function() {
        return (
            <div className="tags">
                <i>{this.getCreatorName()} lisäsi käsittelijäksi käyttäjän </i>
                <span>{this.props.update.get("handler").externalData.username}</span>
            </div>
        );
    },
});


module.exports = HandlerUpdate;

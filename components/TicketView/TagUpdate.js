/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var OnViewportMixin = require("../OnViewportMixin");
var UpdateMixin = require("./UpdateMixin");

/**
 * Render ticket tag change
 *
 * @namespace components
 * @class TicketView.TagUpdate
 * @uses components.TicketView.UpdateMixin
 * @uses components.OnViewportMixin
 */
var TagUpdate = React.createClass({
    mixins: [UpdateMixin, OnViewportMixin],
    render: function() {
        return (
            <div className="tags">
                <i>{this.getCreatorName()} lisäsi tagin: </i>
                <span>{this.props.update.get("tag")}</span>
            </div>
        );
    },
});


module.exports = TagUpdate;

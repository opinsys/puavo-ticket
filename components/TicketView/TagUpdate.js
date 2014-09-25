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
        var tag = this.props.update.get("tag");

        var msg = "";

        switch (tag) {
            case "status:open":
                msg = <i>{this.getCreatorName()} avasi tukipyynnön</i>;
                break;
            case "status:closed":
                msg = <i>{this.getCreatorName()} asetti tukipyynnön ratkaistuksi</i>;
                break;
            default:
                msg =
                    <span>
                        <i>{this.getCreatorName()} lisäsi tagin: </i>
                        {this.props.update.get("tag")}
                    </span>;
        }

        return <div className="TagUpdate ticket-update small">{msg}</div>;
    },
});


module.exports = TagUpdate;

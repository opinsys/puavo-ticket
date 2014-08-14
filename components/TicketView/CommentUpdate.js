/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

var ProfileBadge = require("../ProfileBadge");
var OnViewportMixin = require("../OnViewportMixin");
var UpdateMixin = require("./UpdateMixin");
var ForcedLinebreaks = require("../ForcedLinebreaks");
var TimeAgo = require("../TimeAgo");

/**
 * Renders ticket comment
 *
 * @namespace components
 * @class TicketView.CommentUpdate
 * @uses components.TicketView.UpdateMixin
 * @uses components.OnViewportMixin
 */
var CommentUpdate = React.createClass({
    mixins: [UpdateMixin, OnViewportMixin],
    render: function() {
        var update = this.props.update;
        var hashId = "comment-" + update.get("id");

        return (
            <div className="ticket-updates comments" id={hashId}>
                <div className="image">
                    <ProfileBadge user={update.createdBy()} />
                </div>
                <div className="message">
                    <strong>{update.createdBy().getFullName()} <br/></strong>
                    <ForcedLinebreaks>{update.get("comment")}</ForcedLinebreaks>
                    <a href={"#" + hashId }>
                        <TimeAgo date={update.createdAt()} />
                    </a>
                </div>
            </div>
        );
    },
});

module.exports = CommentUpdate;

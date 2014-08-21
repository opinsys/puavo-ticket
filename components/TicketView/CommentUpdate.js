/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var classSet = React.addons.classSet;

var Comment = require("../../models/client/Comment");
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
 *
 * @constructor
 * @param {Object} props
 * @param {models.client.Comment} props.update
 */
var CommentUpdate = React.createClass({
    mixins: [UpdateMixin, OnViewportMixin],

    propTypes: {
        update: React.PropTypes.instanceOf(Comment).isRequired,
    },

    componentDidMount: function() {
        window.addEventListener("hashchange", this._onHashChange);
    },

    componentWillMount: function() {
        window.removeEventListener("hashchange", this._onHashChange);
    },

    _onHashChange: function() {
        this.forceUpdate();
    },

    render: function() {
        var update = this.props.update;
        var hashId = "comment-" + update.get("id");
        var isSelectedByAddress = window.location.hash.slice(1) === hashId;

        var classes = classSet({
            CommentUpdate: true,
            "ticket-update": true,
            selected: isSelectedByAddress
        });

        return (
            <div className={classes} id={hashId}>
                <ProfileBadge user={update.createdBy()} />
                <div className="message">
                    <span className="commenter-name">{update.createdBy().getFullName()}</span>
                    <ForcedLinebreaks className="comment">{update.get("comment")}</ForcedLinebreaks>
                </div>
                <div className="time">
                    <a href={"#" + hashId } onClick={this.onHashChange}>
                        <TimeAgo date={update.createdAt()} />
                    </a>
                </div>
            </div>
        );
    },
});

module.exports = CommentUpdate;

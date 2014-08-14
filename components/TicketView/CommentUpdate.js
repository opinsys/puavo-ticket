/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var classSet = React.addons.classSet;

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
            "ticket-updates": true,
            selected: isSelectedByAddress
        });

        return (
            <div className={classes} id={hashId}>
                <div className="image">
                    <ProfileBadge user={update.createdBy()} />
                </div>
                <div className="message">
                    <strong>{update.createdBy().getFullName()} <br/></strong>
                    <ForcedLinebreaks>{update.get("comment")}</ForcedLinebreaks>
                    <a href={"#" + hashId } onClick={this.onHashChange}>
                        <TimeAgo date={update.createdAt()} />
                    </a>
                </div>
            </div>
        );
    },
});

module.exports = CommentUpdate;

/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var classSet = React.addons.classSet;

var User = require("../../models/client/User");
var ProfileBadge = require("../ProfileBadge");
var OnViewportMixin = require("../OnViewportMixin");
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
 * @param {models.client.User} props.createdBy
 * @param {Date} props.createdAt
 * @param {String} props.comment
 * @param {String|Number} props.id Anchor link id
 */
var CommentUpdate = React.createClass({
    mixins: [OnViewportMixin],

    propTypes: {
        createdBy: React.PropTypes.instanceOf(User).isRequired,
        createdAt: React.PropTypes.instanceOf(Date).isRequired,
        comment: React.PropTypes.string.isRequired,
        id: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.number
        ]).isRequired
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
        var createdBy = this.props.createdBy;
        var createdAt = this.props.createdAt;
        var comment = this.props.comment;
        var hashId = "comment-" + this.props.id;
        var isSelectedByAddress = window.location.hash.slice(1) === hashId;

        var classes = classSet({
            CommentUpdate: true,
            "ticket-update": true,
            selected: isSelectedByAddress
        });

        return (
            <div className={classes} id={hashId}>
                <ProfileBadge user={createdBy} />
                <div className="message">
                    <span className="commenter-name">{createdBy.getFullName()}</span>
                    <ForcedLinebreaks className="comment">{comment}</ForcedLinebreaks>
                </div>
                <div className="time">
                    <a href={"#" + hashId } onClick={this.onHashChange}>
                        <TimeAgo date={createdAt} />
                    </a>
                </div>
            </div>
        );
    },

    statics: {

        /**
         * @static
         * @method fromUpdate
         * @param {Object} props
         * @param {models.client.Comment} props.update
         * @return {components.TicketView.CommentUpdate}
         */
        fromUpdate: function(props) {
            return CommentUpdate({
                onViewport: props.onViewport,
                createdAt: props.update.createdAt(),
                createdBy: props.update.createdBy(),
                comment: props.update.get("comment"),
                id: props.update.get("id"),
                update: props.update
            });
        }

    }
});

module.exports = CommentUpdate;

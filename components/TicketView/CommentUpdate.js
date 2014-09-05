/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var classSet = React.addons.classSet;

var ProfileBadge = require("../ProfileBadge");
var OnViewportMixin = require("../OnViewportMixin");
var UpdateMixin = require("./UpdateMixin");
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
    mixins: [UpdateMixin, OnViewportMixin],

    componentDidMount: function() {
        window.addEventListener("hashchange", this._onHashChange);
    },

    componentWillMount: function() {
        window.removeEventListener("hashchange", this._onHashChange);
    },

    _onHashChange: function() {
        if (this.isMounted()) this.forceUpdate();
    },

    render: function() {

        var comment = this.props.update;

        var createdBy = comment.createdBy();
        var createdAt = comment.createdAt();
        var commentString = comment.toHTML();
        var hashId = comment.getUniqueId();
        var mergedComments = comment.getMergedComments();

        var currentHashId = window.location.hash.slice(1);

        // Highlight this comment if the unique id of it or from its merged
        // matches with the current url anchor
        var isSelectedByAddress =  currentHashId === hashId || mergedComments.some(function(c) {
            return c.getUniqueId() === currentHashId;
        });

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
                    <a className="since" href={"#" + hashId } onClick={this.onHashChange}>
                        <TimeAgo date={createdAt} />
                    </a>
                    <div className="comment" key={hashId} dangerouslySetInnerHTML={{__html: commentString}} />
                    {mergedComments.map(function(c) {
                        var hashId = c.getUniqueId();
                        return (
                            <div id={hashId} key={hashId} className="comment" dangerouslySetInnerHTML={{__html: c.toHTML()}} />
                        );
                    })}
                </div>
            </div>
        );
    },

});


module.exports = CommentUpdate;

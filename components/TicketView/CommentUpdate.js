/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var classSet = React.addons.classSet;

var Profile = require("../Profile");
var OnViewportMixin = require("../OnViewportMixin");
var UpdateMixin = require("./UpdateMixin");
var TimeAgo = require("../TimeAgo");
var FileItem = require("app/components/FileItem");
var ForcedLinebreaks = require("app/components/ForcedLinebreaks");


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
        var commentString = comment.get("comment");
        var hashId = comment.getUniqueId();
        var mergedComments = comment.getMergedComments();
        var attachments = comment.attachments().concat(mergedComments.reduce(function(a, comment) {
            return a.concat(comment.attachments());
        }, []));

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
                <Profile.Overlay user={createdBy} >
                    <Profile.Badge user={createdBy} />
                </Profile.Overlay>
                <div className="message">
                    <span className="commenter-name">{createdBy.getFullName()}</span>
                    <a className="since" href={"#" + hashId } onClick={this.onHashChange}>
                        <TimeAgo date={createdAt} />
                    </a>
                    <ForcedLinebreaks className="comment" key={hashId} id={hashId} >
                        {commentString}
                    </ForcedLinebreaks>
                    {mergedComments.map(function(c) {
                        var hashId = c.getUniqueId();
                        return (
                            <ForcedLinebreaks className="comment" key={hashId} id={hashId} >
                                {c.get("comment")}
                            </ForcedLinebreaks>
                        );
                    })}
                    {attachments.length > 0 &&
                        <ul className="attachment-list clearfix" >
                            {attachments.map(function(a) {
                                return <li key={a.get("id")} className="attachment" >
                                    <a href={a.toURL()} target="_blank">
                                        <FileItem mime={a.get("dataType")} name={a.get("filename")} size={a.get("size")} />
                                    </a>
                                </li>;
                            })}
                        </ul>}
                </div>
            </div>
        );
    },

});


module.exports = CommentUpdate;

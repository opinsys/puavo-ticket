/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var classSet = React.addons.classSet;
var OverlayTrigger = require("react-bootstrap/OverlayTrigger");
var Tooltip = require("react-bootstrap/Tooltip");

var Fa = require("app/components/Fa");
var SpeechBubble = require("./SpeechBubble");
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
 * @param {Object} props.update
 */
var CommentUpdate = React.createClass({
    mixins: [UpdateMixin, OnViewportMixin],

    propTypes: {
        update: React.PropTypes.object.isRequired,
    },

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
        var attachments = comment.rel("attachments").toArray().concat(mergedComments.reduce(function(a, comment) {
            return a.concat(comment.rel("attachments").toArray());
        }, []));

        var currentHashId = window.location.hash.slice(1);

        // Highlight this comment if the unique id of it or from its merged
        // matches with the current url anchor
        var isSelectedByAddress =  currentHashId === hashId || mergedComments.some(function(c) {
            return c.getUniqueId() === currentHashId;
        });

        var classes = classSet({
            CommentUpdate: true,
            "hidden-comment": comment.get("hidden"),
            "ticket-update": true,
            selected: isSelectedByAddress
        });

        return (
            <SpeechBubble user={createdBy}
                className={classes}
                id={hashId}
                title={<span>
                    <a className="since" href={"#" + hashId } onClick={this.onHashChange}>
                        <TimeAgo date={createdAt} />
                    </a>

                    {comment.get("textType") === "email" &&
                        <OverlayTrigger placement="top" overlay={<Tooltip>Tämä lähetettiin sähköpostilla</Tooltip>}>
                            <Fa icon="envelope" className="CommentUpdate-email-icon" />
                        </OverlayTrigger>}

                </span>}>

                {comment.get("hidden") &&
                    <OverlayTrigger placement="left" overlay={<Tooltip>Tämä on piilotettu kommentti jonka vain ylläpitäjät näkevät</Tooltip>}>
                        <span className="CommentUpdate-hidden-icon-wrap">
                            <Fa icon="eye-slash" />
                        </span>
                    </OverlayTrigger>}

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
            </SpeechBubble>
        );
    },

});


module.exports = CommentUpdate;

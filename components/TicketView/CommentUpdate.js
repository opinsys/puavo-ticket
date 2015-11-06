"use strict";
var React = require("react");
var classNames = require("classnames");
var OverlayTrigger = require("react-bootstrap/lib/OverlayTrigger");
var Tooltip = require("react-bootstrap/lib/Tooltip");

var app = require("../../index");
var Actions = require("../../Actions");
var Fa = require("../Fa");
var SpeechBubble = require("./SpeechBubble");
var OnViewportMixin = require("../OnViewportMixin");
var UpdateMixin = require("./UpdateMixin");
var TimeAgo = require("../TimeAgo");
var FileItem = require("../FileItem");
var ForcedLinebreaks = require("../ForcedLinebreaks");
var ToggleHiddenButton = require("./ToggleHiddenButton");

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

    shouldComponentUpdate: function(nextProps) {
        if (this.props.update.get("hidden") !== nextProps.update.get("hidden")) {
            return true;
        }

        // If comment id does not change no need to render
        return this.props.update.getMergedId() !== nextProps.update.getMergedId();
    },

    onToggleHidden: function(e) {
        var comment = this.props.update;
        comment.setHidden(e.target.value)
        .catch(Actions.error.haltChain("Kommentin näkyvyyden muuttaminen epäonnistui"))
        .then(Actions.refresh);
    },

    render: function() {

        var comment = this.props.update;
        var user = app.currentUser;

        var createdBy = comment.createdBy();
        var createdAt = comment.createdAt();
        var commentString = comment.getStrippedComment();
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

        var classes = classNames({
            CommentUpdate: true,
            "hidden-comment": comment.get("hidden"),
            "ticket-update": true,
            selected: isSelectedByAddress
        });

        var toolbar = null;
        if (user.acl.canAddHiddenComments()) {
            toolbar = <ToggleHiddenButton value={comment.get("hidden")} onChange={this.onToggleHidden} />;
        }

        var emailIcon = <Fa icon="envelope" className="CommentUpdate-email-icon" />;

        return (
            <SpeechBubble user={createdBy}
                className={classes}
                id={hashId}
                toolbar={toolbar}
                title={<span>
                    <a className="since" href={"#" + hashId } onClick={this.onHashChange}>
                        <TimeAgo date={createdAt} />
                    </a>

                    {comment.get("textType") === "email" &&
                        <OverlayTrigger placement="top" overlay={<Tooltip>Tämä lähetettiin sähköpostilla</Tooltip>}>
                            {user.acl.canSeeRawEmail() ? <a href={comment.getRawEmailURL()} >{emailIcon}</a> : emailIcon}
                        </OverlayTrigger>}

                </span>}>

                <ForcedLinebreaks className="comment" key={hashId} id={hashId} >
                    {commentString}
                </ForcedLinebreaks>
                {mergedComments.map(function(c) {
                    var hashId = c.getUniqueId();
                    return (
                        <ForcedLinebreaks className="comment" key={hashId} id={hashId} >
                            {c.getStrippedComment()}
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

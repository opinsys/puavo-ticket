/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var classSet = React.addons.classSet;
var $ = require("jquery");
var _ = require("lodash");

var Button = require("react-bootstrap/Button");
var OverlayTrigger = require("react-bootstrap/OverlayTrigger");
var Tooltip = require("react-bootstrap/Tooltip");
var Label = require("react-bootstrap/Label");

var User = require("app/models/client/User");
var ElasticTextarea = require("app/components/ElasticTextarea");
var BackupInput = require("app/components/BackupInput");
var SpeechBubble = require("./SpeechBubble");


function scrollElBottom(el, padding) {
    padding = padding || 0;
    var $el = $(el);
    window.scrollTo(0, $el.offset().top - $(window).height() + $el.height() + padding);
}


// http://stackoverflow.com/a/488073/153718
function isScrolledIntoView(elem, padding) {
    padding = padding || 0;
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height() + padding;

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}


/**
 * Two mode comment form
 *
 * When single line mode
 *
 *   - Enter key submits the value
 *   - Shift+Enter forces a line break and enables the multiline mode
 *
 * When in multiline mode:
 *
 *   - Enter key adds an additional line break
 *   - Ctrl+Enter submits the value
 *
 * @namespace components
 * @class CommentForm
 * @constructor
 * @param {Object} props
 * @param {Function} [props.onSubmit] Called when the form is submitted with
 * the button or the keyboard shortcut
 * @param {models.client.User} props.user
 */
var CommentForm = React.createClass({

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
        onSubmit: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            onSubmit: function(){}
        };
    },

    getInitialState: function() {
        return {
            comment: "",
            focus: false
        };
    },

    componentDidMount: function() {
        this.scrollToCommentButton = _.throttle(this.scrollToCommentButton, 100);
    },

    isMultilineMode: function() {
        return this.state.comment.split("\n").length > 1;
    },

    /**
     * Return true if the textarea has a proper comment
     *
     * @method hasComment
     * @return {Boolean}
     */
    hasComment: function() {
        return !!this.state.comment.trim();
    },

    _handleKeyDown: function(e) {
        if (e.key !== "Enter") return;

        // Ctrl+Enter always saves the comment
        if (e.ctrlKey) {
            e.preventDefault();
            this._submit();
            return;
        }

        // Shift+Enter or plain enter in multiline mode inserts a line break
        if (e.shiftKey || this.isMultilineMode()) return;

        e.preventDefault();
        this._submit();
    },


    /**
     * Clear the textarea
     *
     * @method clear
     */
    clear: function() {
        this.refs.textarea.clearBackup();
        this.setState({ comment: "" });
    },

    /**
     * Get the textarea value
     *
     * @method getValue
     * @return {String}
     */
    getValue: function() {
        return this.state.comment;
    },

    /**
     * Emit onSubmit event with the current textarea value
     *
     * @private
     * @method _submit
     */
    _submit: function() {
        if (!this.hasComment()) {
            console.log("No comment, no submit");
            return;
        }

        this.props.onSubmit({
            comment: this.state.comment,
            clear: this.clear,
            scrollToCommentButton: this.scrollToCommentButton
        });
        this.refs.textarea.getDOMNode().focus();
    },

    _handleCommentChange: function(e) {
        this.setState({ comment: e.target.value });
    },

    getTipText: function() {
        var tip = {
            title: "Yksirivitila",
            desc: "Enter-näppäin lähettää kommentin. Paina Shift+enter siirtyäksesi monirivitilaan.",
            bsStyle: "default"
        };

        if (this.isMultilineMode()) {
            tip.title = "Monirivitila";
            tip.desc = "Enter-näppäin lisää rivin vaihdon. Paina Ctrl+Enter lähettääksesi kommentin.";
            tip.bsStyle = "success";
        }

        return tip;
    },

    scrollToCommentButton: function() {
        if (!this.refs.commentButton) {
            console.error("Cannot scroll to comment button. Element not available!");
            return;
        }

        var $el = $(this.refs.commentButton.getDOMNode());
        if (isScrolledIntoView($el, 10)) return;
        scrollElBottom($el, 50);
    },

    render: function() {
        var self = this;
        var user = this.props.user;
        var tip = this.getTipText();
        var warning = "";
        if (this.state.comment) {
            warning = <span className="warning">lähettämätön kommentti</span>;
        }

        var className = classSet({
            CommentForm: true,
            selected: this.state.focus
        });

        return (
            <SpeechBubble className={className} user={user} title={warning} >

                <OverlayTrigger placement="left" overlay={<Tooltip>{tip.desc}</Tooltip>}>
                    <Label bsStyle={tip.bsStyle} className="linemode-tooltip">{tip.title}</Label>
                </OverlayTrigger>

                <BackupInput
                    input={ElasticTextarea}
                    backupKey="ticketcomment"
                    ref="textarea"

                    placeholder="Kirjoita uusi kommentti tähän..."
                    className="form-control"
                    value={this.state.comment}
                    onChange={this._handleCommentChange}
                    minRows={1}
                    onKeyDown={this._handleKeyDown}
                    onFocus={function() {
                        self.setState({ focus: true });
                    }}
                    onBlur={function() {
                        self.setState({ focus: false });
                    }}
                    onResize={function(e) {
                        if (e.active) self.scrollToCommentButton();
                    }}
                />

                <div className="ticket-update-buttons">
                    <Button
                        ref="commentButton"
                        onClick={this._submit}
                        disabled={!this.hasComment()} >
                        {this.props.children}
                    </Button>
                </div>

            </SpeechBubble>
        );
    },

});


module.exports = CommentForm;


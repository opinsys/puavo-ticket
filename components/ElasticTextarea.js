/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var _ = require("lodash");

/**
 * Textarea which grows and shrinks automatically when user types text into it
 *
 * @namespace components
 * @class ElasticTextarea
 * @constructor
 * @param {Object} props
 * @param {Function} [props.onResize] Called when the textarea has been resized
 * @param {Number} [props.minRows] Minimum rows size for the textarea
 */
var ElasticTextarea = React.createClass({

    propTypes: {
        onResize: React.PropTypes.func,
        minRows: React.PropTypes.number
    },

    _isTooSmall: function(el) {
        return el.scrollHeight > el.clientHeight;
    },

    getDefaultProps: function() {
        return {
            minRows: 1,
            onResize: function(){}
        };
    },

    _resizeTextarea: function(reset) {

        var el = this.refs.textarea.getDOMNode();

        // Resizing the textarea causes some scrolling glitches when the
        // textarea is very large. Workaround it by forcing the scroll position
        // back to its original
        var currentScrollPosition = [window.scrollX, window.scrollY];

        if (el.value === "") {
            el.rows = parseInt(this.props.minRows, 10);
            return;
        }

        // If the textarea is not too small it might be too big. Force it to be
        // too small.
        if (!this._isTooSmall(el)) el.rows = parseInt(this.props.minRows, 10);

        // Grow the textarea until it's large enough
        while (this._isTooSmall(el)) el.rows++;


        window.scrollTo.apply(window, currentScrollPosition);
        process.nextTick(this.props.onResize.bind(null, {
            target: el,
            active: document.activeElement === el
        }));
    },

    componentWillReceiveProps: function(nextProps) {
        this.setState({ didChange: nextProps.value !== this.props.value });
    },

    componentDidMount: function() {
        this._resizeTextarea = _.throttle(this._resizeTextarea, 100);
        window.addEventListener("resize", this._resizeTextarea);
    },

    componentWillUnmount: function() {
        window.removeEventListener("resize", this._resizeTextarea);
    },

    componentDidUpdate: function() {
        // Resize only if the content has changed
        if (this.state.didChange) this._resizeTextarea();
    },


    style: {
        // Chrome textarea resize tool can mess up this. Disable it.
        resize: "none",
        // When user holds down the enter key scroll bars might appear for few
        // ms as resizing it is throttled. Ensure it stays hidden.
        overflow: "hidden"
    },

    render: function() {
        return this.transferPropsTo(<textarea
            style={this.style}
            rows={this.props.minRows}
            ref="textarea"
            className={"ElasticTextarea " + this.props.className}></textarea>
        );
    }

});


module.exports = ElasticTextarea;

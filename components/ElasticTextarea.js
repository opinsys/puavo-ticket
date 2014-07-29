/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var _ = require("lodash");

/**
 * Textarea which grows and shrinks automatically when user types text into it
 *
 * @namespace components
 * @class ElasticTextarea
 */
var ElasticTextarea = React.createClass({

    _isTooSmall: function(el) {
        return el.scrollHeight > el.clientHeight;
    },

    getDefaultProps: function() {
        return {
            minRows: 1
        };
    },

    _resizeTextarea: function(reset) {

        var el = this.refs.textarea.getDOMNode();

        if (el.value === "") {
            el.rows = parseInt(this.props.minRows, 10);
            return;
        }

        // When searching for the correct height page height might change
        // temporally. Save the scroll position.
        var scrollPosition = [window.scrollX, window.scrollY];

        // If the textarea is not too small it might be too big. Force it to be
        // too small.
        if (!this._isTooSmall(el)) el.rows = parseInt(this.props.minRows, 10);

        // Grow the textarea until it's large enough
        while (this._isTooSmall(el)) el.rows++;

        window.scrollTo.apply(window, scrollPosition);
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
        // ms as resizing it throttled. Ensure it stays hidden.
        overflow: "hidden"
    },

    render: function() {
        return this.transferPropsTo(<textarea
            style={this.style}
            rows={this.props.minRows}
            ref="textarea"
            className="ElasticTextarea"></textarea>);
    }

});


module.exports = ElasticTextarea;

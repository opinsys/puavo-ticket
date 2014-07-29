/** @jsx React.DOM */
"use strict";

var React = require("react/addons");

var ElasticTextarea = require("./ElasticTextarea");

function isMultilineMode(value) {
    return value.split("\n").length > 1;
}

/**
 * Two mode textarea
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
 * @class MultimodeTextarea
 */
var MultimodeTextarea = React.createClass({

    propTypes: {
        onSubmit: React.PropTypes.func,
        onModeChange: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            onSubmit: function(){},
            onModeChange: function(){}
        };
    },

    getInitialState: function() {
        return {
            value: ""
        };
    },

    /**
     * Return true if the textarea has a proper value
     *
     * @method hasValue
     * @return {Boolean}
     */
    hasValue: function() {
        return !!this.state.value.trim();
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
        if (e.shiftKey || isMultilineMode(this.state.value)) return;

        e.preventDefault();
        this._submit();
    },


    /**
     * Clear the textarea and onModeChange event
     *
     * @method clear
     */
    clear: function() {
        this._emitModeChange(this.state.value, "");
        this.setState({ value: "" });
    },

    /**
     * Get the textarea value
     *
     * @method getValue
     * @return {String}
     */
    getValue: function() {
        return this.state.value;
    },

    /**
     * Emit onSubmit event with the current textarea value
     *
     * @private
     * @method _submit
     */
    _submit: function() {
        this.props.onSubmit({
            value: this.state.value,
            clear: this.clear
        });
    },

    /**
     * Emit onModeChange if the mode has changed
     *
     * @private
     * @method _emitModeChange
     * @param {String} previous The previous value
     * @param {String} next The next value
     */
    _emitModeChange: function(previous, next) {
        var previousMode = isMultilineMode(previous);
        var nextMode = isMultilineMode(next);
        if (previousMode !== nextMode) {
            this.props.onModeChange({ multiLineMode: nextMode });
        }
    },

    _handleValueChange: function(e) {
        this._emitModeChange(this.state.value, e.target.value);
        this.setState({ value: e.target.value });
    },

    render: function() {
        return this.transferPropsTo(
            <ElasticTextarea
                value={this.state.value}
                onChange={this._handleValueChange}
                onKeyDown={this._handleKeyDown}
            />);
    },

});


module.exports = MultimodeTextarea;


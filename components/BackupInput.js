/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var _ = require("lodash");


/**
 * Wrapper component for backuping input values automatically to localStorage.
 *
 * Assumes that the input value is set to a `value` prop and `onChange`
 * callback function is called when the value changes
 *
 * @namespace components
 * @class BackupInput
 * @constructor
 * @param {Object} props.input The input component constructor
 * @param {String} props.backupKey Key used to uniquely identify the input instance
 * @param {Function} props.onBackup Called with `{{target: {value: "input value"}}` when the value is restore from backup
 */
var BackupInput = React.createClass({

    propTypes: {
        input: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.func,
        ]).isRequired,
        backupKey: React.PropTypes.string.isRequired,
        onRestore: React.PropTypes.func,
    },

    getDefaultProps: function() {
        return {
            onChange: function(){},
            onRestore: function(){}
        };
    },

    componentDidMount: function() {
        this.backupValue = _.throttle(this.backupValue, 200);
        var value = this._getBackupValue();
        if (value) {
            this.props.onRestore({ target: { value: value }});
        }
    },

    _getFullBackupKey: function() {
        var url = window.location.toString().split("#")[0];
        return "BackupInput:" + url + ":" + this.props.backupKey;
    },

    _onChange: function(e) {
        this.backupValue(e.target.value);
        this.props.onChange(e);
    },

    _getBackupValue: function() {
        return window.localStorage[this._getFullBackupKey()];
    },

    /**
     * Set given value as the backuped value.
     *
     * This is automatically called on the `onChange` callback
     *
     * @method  backupValue
     * @param {String} value
     */
    backupValue: function(value) {
        window.localStorage[this._getFullBackupKey()] = value;
    },

    /**
     * Clear the backup
     *
     * @method clearBackup
     */
    clearBackup: function() {
        this.backupValue("");
    },

    render: function() {
        var Input = this.props.input;
        var value = this.props.value || this._getBackupValue();
        return <Input {...this.props} onChange={this._onChange} value={value} ref="input" />;
    }
});

module.exports = BackupInput;

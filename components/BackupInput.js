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
 */
var BackupInput = React.createClass({

    propTypes: {
        input: React.PropTypes.func.isRequired,
        backupKey: React.PropTypes.string.isRequired
    },

    getDefaultProps: function() {
        return {
            onChange: function(){}
        };
    },

    componentDidMount: function() {
        this.backupValue = _.throttle(this.backupValue, 200);
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
        window.localStorage[this._getFullBackupKey()] = "";
    },

    render: function() {
        var Input = this.props.input;
        var inputProps = _.extend({}, this.props);

        inputProps.onChange = this._onChange;
        inputProps.value = this.props.value || this._getBackupValue();
        inputProps.ref = "input";

        return Input(inputProps, this.children);
    }
});

module.exports = BackupInput;

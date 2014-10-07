/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var _ = require("lodash");


/**
 * BackupInput
 *
 * @namespace components
 * @class BackupInput
 * @constructor
 * @param {Object} props.input
 * @param {String} props.backupKey
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

    getFullBackupKey: function() {
        var url = window.location.toString().split("#")[0];
        return "BackupInput:" + url + ":" + this.props.backupKey;
    },

    backupValue: function(value) {
        window.localStorage[this.getFullBackupKey()] = value;
    },

    getBackupValue: function() {
        return window.localStorage[this.getFullBackupKey()];
    },

    onChange: function(e) {
        this.backupValue(e.target.value);
        this.props.onChange(e);
    },

    clearBackup: function() {
        window.localStorage[this.getFullBackupKey()] = "";
    },

    render: function() {
        var Input = this.props.input;
        var inputProps = _.extend({}, this.props);

        inputProps.onChange = this.onChange;
        inputProps.value = this.props.value || this.getBackupValue();
        inputProps.ref = "input";

        return Input(inputProps, this.children);
    }
});

module.exports = BackupInput;

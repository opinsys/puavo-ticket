/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var Alert = require("react-bootstrap/Alert");

/**
 *
 * @namespace components
 * @class NotificationBox
 * @constructor
 * @param {Object} props
 */
var NotificationBox = React.createClass({

    propTypes: {
        onDismiss: React.PropTypes.func
    },

    render: function() {
        return (
            <div className="NotificationBox">
                <Alert onDismiss={this.props.onDismiss}>
                    {this.props.children}
                </Alert>
            </div>
        );
    }
});

module.exports = NotificationBox;

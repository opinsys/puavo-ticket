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
 * @param {Function} props.onDismiss
 * @param {Number} props.timeout Automatic timeout after ms
 */
var NotificationBox = React.createClass({

    propTypes: {
        onDismiss: React.PropTypes.func,
        timeout: React.PropTypes.number
    },

    clearTimeout: function() {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    },

    dismissAfter: function(timeout) {
        var self = this;

        this._timer = setTimeout(function() {
            self._timer = null;
            if (!self.isMounted()) return;
            self.props.onDismiss(self.props);
        }, timeout);

    },


    componentWillUnmount: function() {
        this.clearTimeout();
    },

    componentWillReceiveProps: function(nextProps) {
        this.clearTimeout();
        if (nextProps.timeout) {
            this.dismissAfter(nextProps.timeout);
        }
    },

    render: function() {
        return (
            <div className="NotificationBox animated bounceInDown">
                <Alert onDismiss={this.props.onDismiss}>
                    {this.props.children}
                </Alert>
            </div>
        );
    }
});

module.exports = NotificationBox;

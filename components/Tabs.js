/** @jsx React.DOM */
"use strict";

var React = require("react/addons");

/**
 * Dumb tabs component. Mainly for sharing CSS styles between different tab
 * instances. Just put bunch of <li> elements as children
 *
 * @namespace components
 * @class Tabs
 * @constructor
 * @param {Object} props
 */
var Tabs = React.createClass({

    propTypes: {
        className: React.PropTypes.string
    },

    getDefaultProps: function() {
        return { className: "" };
    },

    render: function() {
        var className = "Tabs nav nav-tabs " + this.props.className;
        return (
            <ul className={className} role="tablist">
                {this.props.children}
            </ul>
        );
    }
});

module.exports = Tabs;

"use strict";

var React = require("react/addons");
var classSet = React.addons.classSet;

/**
 * Font-Awesome wrapper
 *
 * http://fontawesome.io/icons/
 *
 * @namespace components
 * @class Fa
 * @constructor
 * @param {Object} props
 * @param {Object} props.icon Icon key without the "fa-"Jj prefix
 */
var Fa = React.createClass({

    propTypes: {
        icon: React.PropTypes.string.isRequired,
        spin: React.PropTypes.bool,
        visible: React.PropTypes.bool,
    },

    getDefaultProps: function() {
        return {
            visible: true,
        };
    },

    getStyles: function() {
        var val = this.props.visible ? "visible" : "hidden";
        return { visibility: val };
    },

    render: function() {
        var className = classSet({
            fa: true,
            "fa-spin": this.props.spin,
        });

        className += " fa-" + this.props.icon;
        className += " " + this.props.className;
        return <i {...this.props} className={className.trim()} style={this.getStyles()}></i>;
    }
});

module.exports = Fa;

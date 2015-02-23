"use strict";

var React = require("react/addons");

var ipsumText = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

/**
 * Placeholder text for components while they load.
 *
 * Using the Redacted font https://github.com/christiannaths/Redacted-Font
 *
 * @namespace components
 * @class Redacted
 */
var Redacted = React.createClass({

    propTypes:  {
        ipsum: React.PropTypes.bool,
        generate: React.PropTypes.number
    },

    getDefaultProps: function() {
        return { ipsum: false };
    },

    styles: {
        fontFamily: "redacted-regular",
        opacity: 0.2
    },

    render: function() {
        var content = this.props.children;

        if (this.props.ipsum) {
            content = ipsumText;
        }

        if (this.props.generate) {
            content = new Array(this.props.generate + 1).join( "#" );
        }

        return <span style={this.styles} >{content}</span>;
    }

});

module.exports = Redacted;

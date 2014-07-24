/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

/**
 * A simple loading spinner
 *
 * http://tobiasahlin.com/spinkit/
 *
 * @namespace components
 * @class Loading
 */
var Loading = React.createClass({

    getDefaultProps: function() {
        return {
            visible: true,
            className: ""
        };
    },

    getStyles: function() {
        var val = this.props.visible ? "visible" : "hidden";
        return { visibility: val };
    },

    render: function() {
        return (
            <div className={"Loading spinner " + this.props.className}
                style={this.getStyles()}>
              <div className="bounce1"></div>
              <div className="bounce2"></div>
              <div className="bounce3"></div>
            </div>
        );
    }
});

module.exports = Loading;

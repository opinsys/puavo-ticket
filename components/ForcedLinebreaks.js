/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

/**
 * Render linebreaks as <br />s into a <p>
 *
 * @namespace components
 * @class ForcedLinebreaks
 */
var ForcedLinebreaks = React.createClass({

    getDefaultProps: function() {
        return { className: "" };
    },

    render: function() {
        var string = this.props.children;

        if (typeof string !== "string") {
            throw new Error("Only string children are supported");
        }

        return (
            <p className={"ForcedLinebreaks " + this.props.className} id={this.props.id} >
                {string.trim().split("\n").map(function(line, i) {
                    // Non Breaking Space. React does render &nbsp; literaly as
                    // "&nbsp;" so use the actual character
                    var nbsp = " ";
                    return <span key={i}>{line.trim() || nbsp}</span>;
                })}
            </p>

        );

    }

});

module.exports = ForcedLinebreaks;

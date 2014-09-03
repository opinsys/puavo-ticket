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

        return this.transferPropsTo(
            <p className={"ForcedLinebreaks " + this.props.className}>
                {string.split("\n").map(function(line, i) {
                    return <span key={i}>{line}<br /></span>;
                })}
            </p>
        );

    }

});

module.exports = ForcedLinebreaks;

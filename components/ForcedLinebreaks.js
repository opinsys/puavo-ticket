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

        var vDom = string.trim().split("\n").reduce(function(current, line) {
            current.push(line);
            current.push(<br />);
            return current;
        }, []);

        return (
            <p className={"ForcedLinebreaks " + this.props.className} id={this.props.id} >
                {vDom}
            </p>

        );

    }

});

module.exports = ForcedLinebreaks;

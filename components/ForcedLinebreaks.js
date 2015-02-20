/** @jsx React.DOM */
"use strict";
var React = require("react/addons");


// http://stackoverflow.com/a/3809435/153718
var urlPattern = /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;

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

        // XXX Ugly. And the component name is no good with this in.
        var vDom = string.trim().split("\n").reduce(function(current, rawLine) {
            var urlLine = [];
            var currentChunk = "";

            rawLine.split(" ").forEach(function(word) {
                if (!urlPattern.test(word)) {
                    currentChunk += " " + word;
                    return;
                }

                urlLine.push(currentChunk + " ");
                currentChunk = "";
                var href = word;
                if (!/^https?:\/\//.test(href)) {
                    href = "http://" + href;
                }

                urlLine.push(<a href={href}>{word}</a>);
            });
            if (currentChunk) urlLine.push(currentChunk);

            current.push(urlLine);
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

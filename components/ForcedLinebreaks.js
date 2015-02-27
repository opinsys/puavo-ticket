"use strict";
var React = require("react/addons");
var url = require("url");
var {Link} = require("react-router");
var Glyphicon = require("react-bootstrap/Glyphicon");

var httpPrefix = /^https?:\/\//;

var currentHost = "support.opinsys.fi";
if (typeof window !== "undefined") {
    currentHost = url.parse(window.location.toString()).host;
}


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

        var keyIds = 0;

        // XXX Ugly. And the component name is no good with this in.
        var vDom = string.trim().split("\n").reduce(function(current, rawLine) {
            var urlLine = [];
            var currentChunk = "";

            rawLine.split(" ").forEach(function(word) {
                if (!httpPrefix.test(word)) {
                    currentChunk += " " + word;
                    return;
                }

                urlLine.push(currentChunk + " ");
                currentChunk = "";

                var hrefObject = url.parse(word);
                var linkName = hrefObject.host;
                if (hrefObject.pathname !== "/") {
                    linkName += hrefObject.path;
                }

                if (hrefObject.host !== currentHost) {
                    urlLine.push(
                        <a href={word}
                            key={++keyIds}
                           target="_blank"
                           className="external-link">{linkName} <Glyphicon bsSize="xsmall" glyph="globe" />
                        </a>
                    );
                } else {
                    urlLine.push(<Link key={++keyIds} to={hrefObject.pathname}>{linkName}</Link>);
                }


            });
            if (currentChunk) urlLine.push(currentChunk);

            current.push(urlLine);
            current.push(<br key={++keyIds} />);
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

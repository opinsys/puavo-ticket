/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var classSet = React.addons.classSet;
var diff = require("diff");


/**
 * StringDiff
 *
 * @namespace components
 * @class StringDiff
 * @constructor
 * @param {Object} props
 */
var StringDiff = React.createClass({

    propTypes: {
        previous: React.PropTypes.string.isRequired,
        next: React.PropTypes.string.isRequired,
    },

    render: function() {
        var prev = this.props.previous;
        var next = this.props.next;


        return (
            <span className="StringDiff">
                {diff.diffChars(prev, next).map(function(part) {
                    var className = classSet({
                        added: part.added,
                        removed: part.removed
                    });

                    return <span className={className}>{part.value}</span>;
                })}
            </span>
        );
    }
});

module.exports = StringDiff;

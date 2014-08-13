/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var moment = require("moment");

var mounted = [];

setInterval(function() {
    mounted.forEach(function(c) {
        c.forceUpdate();
    });
}, 30*1000);


/**
 * Render human readable time from the given date object
 *
 * @namespace components
 * @class TimeAgo
 * @constructor
 * @param {Object} props
 * @param {Date} props.date
 */
var TimeAgo = React.createClass({

    propTypes: {
        date: React.PropTypes.instanceOf(Date).isRequired,
    },

    componentDidMount: function() {
        mounted.push(this);
    },

    componentWillUnmount: function() {
        var i = mounted.indexOf(this);
        if (i > -1) mounted.splice(i, 1);
    },

    render: function() {
        var fromNow = moment(this.props.date).fromNow();
        var literaldate = this.props.date.toString();

        return this.transferPropsTo(
            <span className="TimeAgo" title={literaldate}>{fromNow}</span>
        );
    }
});


module.exports = TimeAgo;

/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var moment = require("moment");
var OverlayTrigger = require("react-bootstrap/OverlayTrigger");
var Tooltip = require("react-bootstrap/Tooltip");


// The app will have bunch of these mounted at once. To avoid each one randomly
// updateding collect all the mounted instances here and update the time
// displays at once.
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
        var formatted = moment(this.props.date).format("LLL");

        return (
            <OverlayTrigger placement="top" overlay={<Tooltip>{formatted}</Tooltip>}>
                {this.transferPropsTo(<span className="TimeAgo" title={formatted}>{fromNow}</span>)}
            </OverlayTrigger>
        );
    }
});


module.exports = TimeAgo;

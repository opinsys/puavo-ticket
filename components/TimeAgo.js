"use strict";

var React = require("react");
var moment = require("moment");
var OverlayTrigger = require("react-bootstrap/lib/OverlayTrigger");
var Tooltip = require("react-bootstrap/lib/Tooltip");
var classNames = require("classnames");


// The app will have bunch of these mounted at once. To avoid each one randomly
// updating collect all the mounted instances here and update the time
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

    /**
     * Return true if the date given to this component is in future
     *
     * @method isInFuture
     * @return {Boolean}
     */
    isInFuture: function() {
        return new Date().getTime() - this.props.date.getTime() < 0;
    },

    /**
     * Return the date. If the date is in future just return the current time.
     * Clock skews can put the date few seconds in the future which does not
     * make any sense on timstamps. Future dates are considered as "now".
     *
     * @method getDate
     * @return {Date}
     */
    getDate: function() {
        if (this.isInFuture()) return new Date();
        return this.props.date;
    },

    render: function() {
        var date = this.getDate();
        var fromNow = moment(date).fromNow();
        var formatted = moment(date).format("LLL");

        return (
            <OverlayTrigger placement="top" overlay={<Tooltip id="timeago">{formatted}</Tooltip>}>
                {<span {...this.props} className={classNames("TimeAgo", this.props.className)} title={formatted}>{fromNow}</span>}
            </OverlayTrigger>
        );
    }
});


module.exports = TimeAgo;

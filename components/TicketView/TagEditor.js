/** @jsx React.DOM */
"use strict";

var React = require("react/addons");

var Ticket = require("../../models/client/Ticket");

/**
 * @namespace components
 * @class TagEditor
 * @constructor
 * @param {Object} props
 */
var TagEditor = React.createClass({

    propTypes: {
        ticket: React.PropTypes.instanceOf(Ticket).isRequired,
    },

    render: function() {
        return <span>This is a tags editor</span>;
    }

});


module.exports = TagEditor;

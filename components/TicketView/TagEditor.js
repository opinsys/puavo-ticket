/** @jsx React.DOM */
"use strict";

var React = require("react/addons");

var Ticket = require("../../models/client/Ticket");

/**
 * TagsEditor
 *
 * @namespace components
 * @class TagsEditor
 * @constructor
 * @param {Object} props
 */
var TagsEditor = React.createClass({

    propTypes: {
        ticket: React.PropTypes.instanceOf(Ticket).isRequired,
    },

    render: function() {
        return <span>This is a tags editor</span>;
    }

});


module.exports = TagsEditor;

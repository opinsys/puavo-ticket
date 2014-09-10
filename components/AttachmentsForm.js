/** @jsx React.DOM */
"use strict";

var _ = require("lodash");
var React = require("react/addons");


/**
 * AttachmentsForm
 *
 * @namespace components
 * @class AttachmentsForm
 * @constructor
 * @param {Object} props
 */
var AttachmentsForm = React.createClass({

    getFiles: function() {
        return _.toArray(this.refs.file.getDOMNode().files);
    },

    hasFiles: function() {
        return false;
    },

    render: function() {
        // XXX: Disabled for now
        return (
            <div className="AttachmentsForm" style={{ display: "block" }}>
                <input type="file" ref="file" multiple />
            </div>
        );
    }
});

module.exports = AttachmentsForm;

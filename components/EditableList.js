/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var Button = require("react-bootstrap/Button");


/**
 * @namespace components
 * @class EditableList
 * @constructor
 * @param {Object} props
 */
var EditableList = React.createClass({
    render: function() {
        return (
            <ul className="EditableList">
                {this.props.children}
            </ul>
        );
    }
});

/**
 * @namespace components
 * @class EditableList.Item
 * @constructor
 * @param {Object} props
 * @param {Object} props.onRemove
 */
var Item = React.createClass({

    propTypes: {
        key: React.PropTypes.string.isRequired,
        className: React.PropTypes.string,
        onRemove: React.PropTypes.func,
        permanent: React.PropTypes.bool,
    },

    render: function() {
        var className = "Item " + this.props.className;
        return (
            <li className={className} key={this.props.key}>
                {!this.props.permanent && <Button className="remove-button"
                        bsStyle="danger"
                        bsSize="xsmall"
                        onClick={this.props.onRemove.bind(null, this.props)}>×</Button>}
                {this.props.children}
            </li>
        );
    }
});

EditableList.Item = Item;
module.exports = EditableList;

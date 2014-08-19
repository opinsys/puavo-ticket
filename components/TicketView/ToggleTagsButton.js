/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Button = require("react-bootstrap/Button");

/**
 * ToggleTagsButton
 *
 * @namespace components
 * @class ToggleTagsButton
 * @constructor
 * @param {Object} props
 * @param {Boolean} props.active
 * @param {Function} [props.onClick]
 */
var ToggleTagsButton = React.createClass({

    propTypes: {
        active: React.PropTypes.bool.isRequired,
        onClick: React.PropTypes.func
    },

    render: function() {
        var text = "Näytä tapahtumat";
        if (this.props.active) {
            text = "Piilota tapahtumat";
        }
        return (
            <Button bsStyle="success" className="btn-success" onClick={this.props.onClick}>
                <i className="fa fa-comments-o"></i>{text}
            </Button>
        );
    }
});


module.exports = ToggleTagsButton;

"use strict";

var React = require("react/addons");
var Glyphicon = require("react-bootstrap/Glyphicon");
var OverlayTrigger = require("react-bootstrap/OverlayTrigger");
var Tooltip = require("react-bootstrap/Tooltip");
var Button = require("react-bootstrap/Button");

/**
 * EditableText
 *
 * @namespace components
 * @class EditableText
 * @constructor
 * @param {Object} props
 * @param {Function} [props.onSubmit] Called when the form is submitted with
 * @param {Boolean} [props.disabled=false] Disable editing (hide the edit button)
 */
var EditableText = React.createClass({

    propTypes: {
        onSubmit: React.PropTypes.func,
        text: React.PropTypes.string,
        disabled: React.PropTypes.bool
    },

    getDefaultProps: function() {
        return {
            text: "",
            disabled: false,
            onSubmit: function(){},
            className: ""
        };
    },

    getInitialState: function() {
        return {
            value: "",
            editing: false
        };
    },

    startEditing: function() {
        this.setState({
            editing: true,
            value: this.props.text
        });
    },

    onInputChange: function(e) {
        this.setState({ value: e.target.value });
    },

    submit: function() {
        this.setState({ editing: false });
        this.props.onSubmit({ value: this.state.value });
    },

    cancel: function() {
        this.setState({ editing: false });
    },

    handleKeyDown: function(e) {
        if (e.key === "Enter") this.submit();
    },

    getClassName: function() {
        return "EditableText " + this.props.className;
    },

    renderTitle: function() {
        return (
            <div className={this.getClassName()}>
                <span className="content-wrap" ref="content">{this.props.children}</span>

                {!this.props.disabled &&
                <OverlayTrigger
                    placement="top"
                    overlay={<Tooltip>Muokkaa otsikkoa</Tooltip>}>
                        <button className="EditableText-start-button" onClick={this.startEditing} >
                            <Glyphicon glyph="edit" />
                        </button>
                </OverlayTrigger>}
            </div>
        );
    },

    renderInput: function() {
        return (
            <div className={this.getClassName()}>
                <input
                    className="form-control EditableText-input"
                    type="text"
                    value={this.state.value}
                    onChange={this.onInputChange}
                    onKeyDown={this.handleKeyDown} />
                <Button className="EditableText-save-button" onClick={this.submit}>Tallenna</Button>
                <Button bsStyle="danger" onClick={this.cancel}>Peruuta</Button>
            </div>
        );
    },

    render: function() {
        if (this.props.disabled) return this.renderTitle();
        if (this.state.editing) return this.renderInput();
        return this.renderTitle();
    },



});

module.exports = EditableText;

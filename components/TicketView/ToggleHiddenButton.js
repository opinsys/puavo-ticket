"use strict";
var React = require("react");
var classNames = require("classnames");

var OverlayTrigger = require("react-bootstrap/lib/OverlayTrigger");
var Tooltip = require("react-bootstrap/lib/Tooltip");

var Fa = require("../Fa");



/**
 * @namespace components
 * @class ToggleHiddenButton
 * @constructor
 * @param {Object} props
 */
var ToggleHiddenButton = React.createClass({

    propTypes: {
        value: React.PropTypes.bool,
        onChange: React.PropTypes.func.isRequired
    },

    onChange() {
        this.props.onChange({ target: { value: !this.props.value }});
    },

    render() {

        var hiddenToggleClasses = classNames({
            "ToggleHiddenButton": true,
            active: !!this.props.value
        });

        return (
            <OverlayTrigger placement="left"
                overlay={<Tooltip id="make-hidden">Tee kommentista piilotettu kommentti jonka vain toiset ylläpitäjät näkevät</Tooltip>}>
                <button className={hiddenToggleClasses} onClick={this.onChange}>
                    <Fa icon="eye-slash" />
                </button>
            </OverlayTrigger>
        );
    }
});

module.exports = ToggleHiddenButton;

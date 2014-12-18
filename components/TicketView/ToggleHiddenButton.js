"use strict";
var React = require("react/addons");
var classSet = React.addons.classSet;

var OverlayTrigger = require("react-bootstrap/OverlayTrigger");
var Tooltip = require("react-bootstrap/Tooltip");

var Fa = require("app/components/Fa");



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

        var hiddenToggleClasses = classSet({
            "ToggleHiddenButton": true,
            active: !!this.props.value
        });

        return (
            <OverlayTrigger placement="left"
                overlay={<Tooltip>Tee kommentista piilotettu kommentti jonka vain toiset ylläpitäjät näkevät</Tooltip>}>
                <button className={hiddenToggleClasses} onClick={this.onChange}>
                    <Fa icon="eye-slash" />
                </button>
            </OverlayTrigger>
        );
    }
});

module.exports = ToggleHiddenButton;

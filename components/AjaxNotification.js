"use strict";
var React = require("react/addons");
var classSet = React.addons.classSet;

var Reflux = require("reflux");
var InlineSVG = require('react-inlinesvg');


var AjaxStore = require("../stores/AjaxStore");


/**
 * Display loading animation when there is an ajax operation going on
 *
 * @namespace components
 * @class AjaxNotification
 * @constructor
 * @param {Object} props
 */
var AjaxNotification = React.createClass({

    mixins: [Reflux.connect(AjaxStore)],

    render: function() {

        var classes = {
            AjaxNotification: true,
            "AjaxNotification-reading": this.state.readOps > 0,
            "AjaxNotification-writing": this.state.writeOps > 0
        };

        classes["AjaxNotification-visible"] = (
            classes["AjaxNotification-reading"] || classes["AjaxNotification-writing"]
        );

        var tooltip = "Latausindikaattori";

        if (classes["AjaxNotification-reading"]) {
            tooltip = "Haetaan muutoksia...";
        }

        if (classes["AjaxNotification-writing"]) {
            tooltip = "Tallennetaan muutoksia...";
        }

        return (
            <div className={classSet(classes)} title={tooltip}>
                <InlineSVG src="/images/cloud.svg" />
            </div>
        );
    }
});

module.exports = AjaxNotification;


"use strict";
var React = require("react");

var Redacted = require("./Redacted");

/**
 * @namespace components
 * @class StatusBadge
 * @constructor
 * @param {Object} props
 */
var StatusBadge = React.createClass({

    propTypes: {
        status: React.PropTypes.oneOf(["pending", "open", "closed"]).isRequired
    },


    render: function() {
        var status = this.props.status;

        var inner = null;
        switch (status) {
            case "pending":
                inner = <span className="StatusBadge-inner StatusBadge-pending">Uusi</span>;
                break;
            case "open":
                inner = <span className="StatusBadge-inner StatusBadge-open">Käsittelyssä</span>;
                break;
            case "closed":
                inner = <span className="StatusBadge-inner StatusBadge-closed">Ratkaistu</span>;
                break;
            default:
                inner = <span className="StatusBadge-inner"><Redacted>Unknown</Redacted></span>;
                break;
        }

        return <div className="StatusBadge" style={this.props.style}>{inner}</div>;
    }
});

module.exports = StatusBadge;

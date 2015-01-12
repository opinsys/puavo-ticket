/** @jsx React.DOM */
"use strict";
var React = require("react/addons");

var OnViewportMixin = require("../OnViewportMixin");
var UpdateMixin = require("./UpdateMixin");
var Profile = require("../Profile");

/**
 * Render ticket tag change
 *
 * @namespace components
 * @class TicketView.TagUpdate
 * @uses components.TicketView.UpdateMixin
 * @uses components.OnViewportMixin
 */
var TagUpdate = React.createClass({
    mixins: [UpdateMixin, OnViewportMixin],
    render: function() {
        var tag = this.props.update.get("tag");
        var msg = "";
        var user = this.props.update.createdBy();
        var creator = (
            <Profile.Overlay user={user} tipPlacement="top">
                {user.getFullName()}
            </Profile.Overlay>
        );

        switch (tag) {
            case "status:pending":
                msg = <i>Tukipyyntö odottaa käsittelijää</i>;
                break;
            case "status:open":
                msg = <i>{creator} asetti tukipyynnön käsittelyyn</i>;
                break;
            case "status:closed":
                msg = <i>{creator} asetti tukipyynnön ratkaistuksi</i>;
                break;
        }

        return <div className="TagUpdate ticket-update small">{msg}</div>;
    },
});


module.exports = TagUpdate;

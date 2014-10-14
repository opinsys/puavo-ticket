/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var classSet = React.addons.classSet;

var OnViewportMixin = require("../OnViewportMixin");
var UpdateMixin = require("./UpdateMixin");
var Profile = require("app/components/Profile");

/**
 * Render ticket handler change update
 *
 * @namespace components
 * @class TicketView.HandlerUpdate
 * @uses components.TicketView.UpdateMixin
 * @uses components.OnViewportMixin
 */
var HandlerUpdate = React.createClass({
    mixins: [UpdateMixin, OnViewportMixin],

    render: function() {
        var className = classSet({
            HandlerUpdate: true,
            "ticket-update": true,
            small: true,
            deleted: this.props.update.isSoftDeleted()
        });

        var createdBy = this.props.update.createdBy();
        var user = this.props.update.getUser();
        return (
            <div className={className}>
                <i>
                    <Profile.Overlay user={createdBy} tipPlacement="top">
                        {createdBy.getFullName()}
                    </Profile.Overlay>
                    lisäsi käsittelijäksi käyttäjän </i>

                <Profile.Overlay user={user} tipPlacement="top">
                    {user.getFullName()}
                </Profile.Overlay>
            </div>
        );
    },
});


module.exports = HandlerUpdate;

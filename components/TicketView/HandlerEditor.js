
/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var Promise = require("bluebird");
var _ = require("lodash");
var Navigation = require("react-router").Navigation;

var Loading = require("../Loading");
var Ticket = require("../../models/client/Ticket");
var User = require("../../models/client/User");
var SelectUsers = require("../SelectUsers");
var captureError = require("../../utils/captureError");

/**
 *
 * @namespace components
 * @class HandlerEditor
 * @constructor
 * @param {Object} props
 */
var HandlerEditor = React.createClass({

    mixins: [Navigation],

    propTypes: {
        ticket: React.PropTypes.instanceOf(Ticket).isRequired,
        user: React.PropTypes.instanceOf(User).isRequired,
    },

    getInitialState: function() {
        return {
            saving: false
        };
    },

    render: function() {
        var self = this;
        var ticket = this.props.ticket;
        var user = this.props.user;
        var saving = this.state.saving;

        return (
            <div className="HandlerEditor">
                <h1>Lisää käsittelijöitä</h1>
                <SelectUsers
                    buttonLabel="Lisää käsittelijät"
                    user={user}
                    ticket={ticket}
                    currentHandlers={_.invoke(ticket.handlers(), "getUser")}
                    onSelect={function(users) {
                        if (self.isMounted()) self.setState({ saving: true });

                        Promise.map(users, function(user) {
                            return ticket.addHandler(user);
                        })
                        .then(function() {
                            self.transitionTo("ticket", { id: ticket.get("id") });
                        })
                        .catch(captureError("Käsittelijöiden lisääminen epäonnistui"));
                }}/>
                <Loading visible={saving} />
        </div>
        );
    }

});


module.exports = HandlerEditor;

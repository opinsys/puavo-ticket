
/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var _ = require("lodash");
var Promise = require("bluebird");
var Navigation = require("react-router").Navigation;
var Reflux = require("reflux");

var app = require("../../index");
var Fa = require("../Fa");
var Ticket = require("../../models/client/Ticket");
var SelectUsers = require("../SelectUsers");
var EditableList = require("../EditableList");
var Profile = require("../Profile");
var TicketStore = require("../../stores/TicketStore");
var ErrorActions = require("../../stores/ErrorActions");

/**
 *
 * @namespace components
 * @class HandlerEditor
 * @constructor
 * @param {Object} props
 * @param {models.client.Ticket} props.ticket
 */
var HandlerEditor = React.createClass({

    mixins: [
        Navigation,
        Reflux.listenTo(TicketStore, "onTicketUpdate")
    ],

    propTypes: {
        ticket: React.PropTypes.instanceOf(Ticket).isRequired,
    },

    getInitialState: function() {
        return { saving: false };
    },

    onTicketUpdate: function() {
        this.setState({ saving: false });
    },

    removeHandler: function(handlerRelation) {
        this.setState({ saving: true });
        Promise.resolve(handlerRelation.destroy())
        .catch(ErrorActions.haltChain("Käsittelijän poistaminen epäonnistui"))
        .then(TicketStore.Actions.refreshTicket);
    },

    /**
     * Add user as handler for the ticket
     *
     * @method addHandler
     * @param {models.client.User} user
     * @return {Bluebird.Promise}
     */
    addHandler: function(user) {
        this.setState({ saving: true });
        this.props.ticket.addHandler(user)
        .catch(ErrorActions.haltChain("Käsittelijän lisääminen epäonnistui"))
        .then(TicketStore.Actions.refreshTicket);
    },

    render: function() {
        var self = this;
        var ticket = this.props.ticket;
        var user = app.currentUser;
        var saving = this.state.saving;
        var handlerRelations = ticket.rel("handlers").filter(h => !h.isSoftDeleted());

        var searchOrganisations = ticket.getRelatedOrganisationDomains();

        return (
            <div className="HandlerEditor">
                <h1>Käsittelijät</h1>
                <EditableList>
                    {handlerRelations.map(function(handler) {
                        var user = handler.getUser();
                        return (
                            <EditableList.Item key={""+user.get("id")}
                                               onRemove={self.removeHandler.bind(self, handler)} >
                                <Profile.Overlay clickForDetails user={user} tipPlacement="top">{user.getAlphabeticName()}</Profile.Overlay>
                          </EditableList.Item>
                        );
                    })}
                </EditableList>


                <h2>Lisää { saving && <Fa icon="spinner" spin={true} />}</h2>
                <SelectUsers
                    searchOrganisations={searchOrganisations}
                    buttonLabel="Lisää käsittelijät"
                    user={user}
                    ticket={ticket}
                    selectedUsers={_.invoke(handlerRelations, "getUser")}
                    onSelect={this.addHandler}/>
        </div>
        );
    }

});


module.exports = HandlerEditor;

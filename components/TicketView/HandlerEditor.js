
/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var _ = require("lodash");
var Promise = require("bluebird");
var Navigation = require("react-router").Navigation;

var app = require("app");
var Fa = require("../Fa");
var Ticket = require("app/models/client/Ticket");
var SelectUsers = require("../SelectUsers");
var EditableList = require("app/components/EditableList");
var Profile = require("app/components/Profile");
var captureError = require("app/utils/captureError");

/**
 *
 * @namespace components
 * @class HandlerEditor
 * @constructor
 * @param {Object} props
 * @param {models.client.Ticket} props.ticket
 */
var HandlerEditor = React.createClass({

    mixins: [Navigation],

    propTypes: {
        ticket: React.PropTypes.instanceOf(Ticket).isRequired,
    },

    getInitialState: function() {
        return {
            saving: false
        };
    },

    removeHandler: function(handlerRelation) {
        var self = this;
        var ticket = this.props.ticket;
        self.setState({ saving: true });
        Promise.resolve(handlerRelation.destroy())
        .then(function() {
            if (self.isMounted()) {
                self.setState({ saving: false });
                return ticket.fetch();
            }
        })
        .catch(captureError("Käsittelijän poistaminen epäonnistui"));
    },

    /**
     * Add user as handler for the ticket
     *
     * @method addHandler
     * @param {models.client.User} user
     * @return {Bluebird.Promise}
     */
    addHandler: function(user) {
        var self = this;
        var ticket = this.props.ticket;
        self.setState({ saving: true });
        ticket.addHandler(user)
        .then(function() {
            if (self.isMounted()) {
                self.setState({ saving: false });
                return ticket.fetch();
            }
        })
        .catch(captureError("Käsittelijän lisääminen epäonnistui"));
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

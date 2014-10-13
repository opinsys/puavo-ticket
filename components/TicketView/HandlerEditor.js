
/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var _ = require("lodash");
var Promise = require("bluebird");
var Navigation = require("react-router").Navigation;

var Fa = require("../Fa");
var Ticket = require("../../models/client/Ticket");
var User = require("../../models/client/User");
var SelectUsers = require("../SelectUsers");
var EditableList = require("app/components/EditableList");
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

    removeHandler: function(handlerRelation) {
        var self = this;
        var ticket = this.props.ticket;
        self.setState({ saving: true });
        console.log("removing", handlerRelation);
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
        var user = this.props.user;
        var saving = this.state.saving;
        var handlerRelations = ticket.handlers().filter(function(h) {
            return !h.isSoftDeleted();
        });

        var creatorDomain = ticket.createdBy().getOrganisationDomain();
        var currentDomain = user.getOrganisationDomain();
        var searchOrganisations = [user.getOrganisationDomain()];

        // If the user is manager and the ticket creator is from a another
        // organisation search users from that organisation too.
        if (creatorDomain !== currentDomain && user.isManager()) {
            searchOrganisations.push(creatorDomain);
        }

        return (
            <div className="HandlerEditor">
                <h1>Käsittelijät</h1>
                <EditableList>
                    {handlerRelations.map(function(handler) {
                        var user = handler.getUser();
                        return <EditableList.Item key={""+user.get("id")}
                                                  onRemove={self.removeHandler.bind(self, handler)} >
                            {user.getFullName()}
                        </EditableList.Item>;
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

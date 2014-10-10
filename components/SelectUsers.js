/** @jsx React.DOM */
"use strict";

var _ = require("lodash");
var React = require("react/addons");
var Promise = require("bluebird");

var Button = require("react-bootstrap/Button");

var User = require("../models/client/User");
var Ticket = require("../models/client/Ticket");
var captureError = require("../utils/captureError");


/**
 * UserItem
 *
 * @namespace components
 * @class SelectUsers.UserItem
 * @constructor
 * @param {Object} props
 * @param {models.client.User} props.user
 */
var UserItem = React.createClass({

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
    },

    getDefaultProps: function() {
        return {
            checked: false,
            disabled: false
        };
    },

    handleOnChange: function(e) {
        if (e.target.checked) this.props.onSelectUser(this.props.user);
        else this.props.onRemoveUser(this.props.user);
    },

    render: function() {
        var id = _.uniqueId("checkbox");
        var user = this.props.user;
        return (
            <label className="UserItem" htmlFor={id}>
                <input
                    id={id}
                    type="checkbox"
                    checked={this.props.checked}
                    disabled={this.props.disabled}
                    onChange={this.handleOnChange}
                    ref="checkbox" />
                <span className="first-name" >{user.get("externalData").first_name + " "}</span>
                <span className="last-name" >{user.get("externalData").last_name + " "}</span>
                <span className="badge" >{user.getDomainUsername()}</span>
            </label>
        );
    }
});



/**
 * SelectUsers
 *
 * @namespace components
 * @class SelectUsers
 * @constructor
 * @param {Object} props
 * @param {models.client.User} props.user
 * @param {models.client.Ticket} props.Ticket
 */
var SelectUsers = React.createClass({

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
        ticket: React.PropTypes.instanceOf(Ticket).isRequired,
        buttonLabel: React.PropTypes.string.isRequired
    },


    getInitialState: function() {
        var user = this.props.user;
        var ticket = this.props.ticket;
        var creatorDomain = ticket.createdBy().getOrganisationDomain();
        var currentDomain = user.getOrganisationDomain();
        var orgs = [user.getOrganisationDomain()];

        // If the user is manager and the ticket creator is from a another
        // organisation search users from that organisation too.
        if (creatorDomain !== currentDomain && user.isManager()) {
            orgs.push(creatorDomain);
        }

        return {
            organisations: orgs.join(","),
            searchString: "",
            searchOp: null,
            searchedUsers: [],
            selectedUsers: this.props.currentHandlers
        };
    },

    getSelectedOrganisations: function() {
        return this.state.organisations.split(",");
    },

    /**
     * Search users with the given search string. The results will be saved to
     * the component state in `searchedUsers` key
     *
     * @method doSearch
     * @param {String} searchString
     */
    doSearch: function(searchString) {
        this.cancelCurrentSearch();

        var self = this;
        var searchOp = Promise.map(this.getSelectedOrganisations(), function(domain) {
            if (!domain) return [];
            return User.search(domain, searchString)
            .catch(function(err) {
                if (err.responseJSON && err.responseJSON.error.message === "Cannot configure organisation for this request") {
                    // User just typed an invalid organisation domain
                    console.error("Bad organisation domain", err.responseJSON);
                    return [];
                }
                throw err;
            });
        })
        .then(function(users) {
            self.setState({ searchedUsers: _.flatten(users) });
        })
        .catch(Promise.CancellationError, function() {
            // cancel is ok
        })
        .catch(captureError("Käyttäjien haku epäonnistui"));

        self.setState({ searchOp: searchOp });
    },

    componentWillMount: function() {
        // search after 500ms of silence for each mounted component
        this.bouncedSearch = _.debounce(this.doSearch, 500);
    },

    componentDidMount: function() {
        this.refs.search.getDOMNode().focus();
    },

    cancelCurrentSearch: function() {
        if (!this.state.searchOp) return;
        if (!this.state.searchOp.isPending()) return;
        this.state.searchOp.cancel();
    },



    handleSearchStringChange: function(e) {
        this.setState({ searchString: e.target.value });
        this.bouncedSearch(e.target.value);
    },

    handleSelectUser: function(user) {
        this.refs.search.getDOMNode().focus();
        if (this.isSelected(user)) return;

        this.setState({
            selectedUsers: this.state.selectedUsers.concat(user)
        });

    },

    handleRemoveUser: function(user) {
        this.refs.search.getDOMNode().focus();
        this.setState({
            selectedUsers: this.state.selectedUsers.filter(function(selectedUser) {
                return selectedUser.getExternalId() !== user.getExternalId();
            })
        });
    },

    /**
     * saved handlers cannot be removed yet...
     */
    isSaved: function(user) {
        return this.props.currentHandlers.some(function(selectedUser) {
            return selectedUser.getExternalId() === user.getExternalId();
        });
    },

    isSelected: function(user) {
        return this.state.selectedUsers.some(function(selectedUser) {
            return selectedUser.getExternalId() === user.getExternalId();
        });
    },

    handleOk: function(e) {
        e.preventDefault();
        var self = this;
        this.props.onSelect(this.state.selectedUsers.filter(function(user) {
            return !self.isSaved(user);
        }));
    },

    handleOrganisationChange: function(e) {
        this.setState({ organisations: e.target.value });
        this.bouncedSearch(this.state.searchString);
    },

    render: function() {
        var self = this;
        return (
            <div className="SelectUsers">
                <div className="search-input-wrap">
                    <input
                        className="form-control search-input"
                        ref="search"
                        placeholder="Aloita kirjoittamaan käsittelijän nimeä"
                        value={self.state.searchString}
                        onChange={self.handleSearchStringChange} />
                </div>

                <div className="selectuser">
                    <ul className="list-group" >
                        {self.state.searchedUsers.map(function(user) {
                            return (
                                <li key={user.get("externalId")} className="list-group-item" >
                                    <UserItem
                                        user={user}
                                        disabled={self.isSaved(user)}
                                        checked={self.isSelected(user)}
                                        onRemoveUser={self.handleRemoveUser}
                                        onSelectUser={self.handleSelectUser} />
                                </li>
                            );
                        })}
                    </ul>

                    {self.state.selectedUsers.length > 0 &&
                        <h3>
                            Valitut
                        </h3>
                    }

                    <ul className="list-group" >
                        {self.state.selectedUsers.map(function(user) {
                            return (
                                <li key={user.get("externalId")} className="list-group-item selected" >
                                    <UserItem
                                        user={user}
                                        checked={self.isSelected(user)}
                                        disabled={self.isSaved(user)}
                                        onRemoveUser={self.handleRemoveUser}
                                        onSelectUser={self.handleSelectUser} />
                                </li>
                            );
                        })}
                    </ul>

                </div>

                <div className="search-input-wrap">
                    <h4>Organisaatiot joista käyttäjiä haetaan</h4>
                    <input
                        className="form-control"
                        onChange={self.handleOrganisationChange}
                        value={self.state.organisations}
                    />
                </div>

                <div className="modal-footer">
                    <Button onClick={self.handleOk}>
                        {self.props.buttonLabel}
                    </Button>
                </div>

            </div>
        );
    },

});

module.exports = SelectUsers;

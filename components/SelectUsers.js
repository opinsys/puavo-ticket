/** @jsx React.DOM */
"use strict";

var _ = require("lodash");
var React = require("react/addons");
var Promise = require("bluebird");

var User = require("../models/client/User");
var captureError = require("../utils/captureError");


/**
 * UserItem
 *
 * @namespace components
 * @class SelectUsers.UserItem
 * @constructor
 * @param {Object} props
 * @param {models.client.User} props.user
 * @param {Function} props.onSelect
 */
var UserItem = React.createClass({

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
        onSelect: React.PropTypes.func.isRequired,
        checked: React.PropTypes.bool,
        disabled: React.PropTypes.bool,
    },

    getDefaultProps: function() {
        return {
            checked: false,
            disabled: false
        };
    },


    handleOnChange: function(e) {
        if (!e.target.checked) return;
        this.props.onSelect(this.props.user);
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
 * @param {Array} props.searchOrganisations Organisations where the users are searched from
 * @param {Array} props.selectedUsers Already selected users that should be disabled on the search list
 * @param {Function} props.onSelect Function to be called on user select
 * @param {Boolean} props.editOrganisations Enable organisations edit
 */
var SelectUsers = React.createClass({

    propTypes: {
        searchOrganisations: React.PropTypes.array,
        selectedUsers: React.PropTypes.array,
        onSelect: React.PropTypes.func.isRequired,
        editOrganisations: React.PropTypes.bool,
    },


    getInitialState: function() {
        return {
            customOrganisations: "",
            searchString: "",
            searchOp: null,
            searchedUsers: [],
        };
    },

    getSearchOrganisations: function() {
        if (this.state.customOrganisations.trim()) {
            return this.state.customOrganisations.split(",");
        } else {
            return this.props.searchOrganisations;
        }
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
        var searchOp = Promise.map(this.getSearchOrganisations(), function(domain) {
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
            users = _.flatten(users);
            users.sort(function(a, b) {
                var aName = a.getFullName();
                var bName = b.getFullName();
                if (aName > bName) return 1;
                if (aName < bName) return -1;
                return 0;
            });
            self.setState({ searchedUsers: users });
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
        this.fixOrganisations();
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
        this.props.onSelect(user);
    },


    isSelected: function(user) {
        return this.props.selectedUsers.some(function(selectedUser) {
            return selectedUser.getExternalId() === user.getExternalId();
        });
    },


    handleOrganisationChange: function(e) {
        this.setState({ customOrganisations: e.target.value });
        this.bouncedSearch(this.state.searchString);
    },

    fixOrganisations: function() {
        if (this.state.customOrganisations.trim()) return;
        this.setState({
            customOrganisations: this.props.searchOrganisations.join(",")
        });
    },

    handleKeyDown: function(e) {
        if (e.key !== "Enter") return;
        var user = this.state.searchedUsers[0];
        if (this.isSelected(user)) return;
        if (user) this.props.onSelect(user);
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
                        onKeyDown={self.handleKeyDown}
                        onChange={self.handleSearchStringChange} />
                </div>

                <div className="selectuser">
                    <ul className="list-group" >
                        {self.state.searchedUsers.map(function(user) {
                            var disable = self.isSelected(user);
                            return (
                                <li key={user.get("externalId")} className="list-group-item" >
                                    <UserItem
                                        user={user}
                                        disabled={disable}
                                        checked={disable}
                                        onSelect={function(user) {
                                            if (disable) return;
                                            self.props.onSelect(user);
                                        }} />
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
                        onBlur={self.fixOrganisations}
                        value={self.state.customOrganisations}
                    />
                </div>
            </div>
        );
    },

});

module.exports = SelectUsers;

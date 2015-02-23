"use strict";

var _ = require("lodash");
var React = require("react/addons");
var classSet = React.addons.classSet;
var Promise = require("bluebird");

var Actions = require("../Actions");
var Fa = require("./Fa");
var User = require("../models/client/User");
var Profile = require("./Profile");


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
        var disabled = this.props.disabled;
        var emailMissing = !user.getEmail();

        if (emailMissing) disabled = true;

        var className = classSet({
            UserItem: true,
            "email-missing": emailMissing
        });


        return (
            <div className={className}>
                <label>
                    <input
                        id={id}
                        type="checkbox"
                        autofocus
                        checked={this.props.checked}
                        disabled={disabled}
                        onChange={this.handleOnChange}
                        ref="checkbox" />
                    <span>
                        <span className="name">
                            {user.getAlphabeticName()}
                        </span>
                    </span>
                </label>

                <span className="badge" >{user.getOrganisationDomain()}</span>

                <Profile.Overlay user={user} clickForDetails tipPlacement="left">
                    <a href="#" className="SelectUsers-details-link" >tiedot</a>
                </Profile.Overlay>

            </div>
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
            searching: false,
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
        this.setState({ searching: true });
        var searchOp = Promise.map(this.getSearchOrganisations(), function(domain) {
            if (!domain) return [];
            return User.search(domain, searchString)
            .catch(function(err) {
                // Don't touch plain javascript errors
                if (err instanceof Error) throw err;
                // Just log puavo-rest errors. Will happen on invalid
                // organisation domains etc.
                console.error("Bad organisation domain " + domain, err.data);
                return [];
            });
        })
        .then(function(users) {
            users = _.flatten(users);
            users.sort(function(a, b) {
                var aName = a.getAlphabeticName();
                var bName = b.getAlphabeticName();
                if (aName > bName) return 1;
                if (aName < bName) return -1;
                return 0;
            });

            self.setState({
                searching: false,
                searchedUsers: users
            });
        })
        .catch(Promise.CancellationError, function() {
            // cancel is ok
        })
        .catch(Actions.error.haltChain("Käyttäjien haku epäonnistui"));

        self.setState({ searchOp: searchOp });
    },

    componentWillMount: function() {
        // search after a second of silence
        this.bouncedSearch = _.debounce(this.doSearch, 1000);
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
        this.cancelCurrentSearch();
        this.refs.search.getDOMNode().focus();
        this.props.onSelect(user);
        this.setState({
            searchString: "",
            searching: false,
            searchedUsers: []
        });
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
        if (e.key === "Enter") {
            this.doSearch(this.state.searchString);
        }
    },

    render: function() {
        var self = this;
        var searching = self.state.searching;
        return (
            <div className="SelectUsers">
                <div className="search-input-wrap">
                    <input
                        type="search"
                        className="form-control SelectUsers-search-input"
                        ref="search"
                        placeholder="Aloita kirjoittamaan käsittelijän nimeä"
                        value={self.state.searchString}
                        onKeyDown={self.handleKeyDown}
                        onChange={self.handleSearchStringChange} />

                </div>

                <div className="SelectUsers-search-results">
                    <ul className="list-group" >
                        {self.state.searchedUsers.map(function(user) {
                            var disable = self.isSelected(user);
                            var key = user.get("externalData").id;
                            return (
                                <li key={key} className="list-group-item" >
                                    <UserItem
                                        user={user}
                                        disabled={disable}
                                        checked={disable}
                                        onSelect={function(user) {
                                            if (disable) return;
                                            self.handleSelectUser(user);
                                        }} />
                                </li>
                            );
                        })}
                    </ul>
                    <div className="spinner-wrap">
                        {searching && <Fa icon="spinner" spin={true} />}
                    </div>
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

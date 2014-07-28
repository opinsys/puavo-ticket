/** @jsx React.DOM */
"use strict";

var _ = require("lodash");
var React = require("react/addons");
var Promise = require("bluebird");

var Button = require("react-bootstrap/Button");

var User = require("../models/client/User");


/**
 * UserItem
 *
 * @namespace components
 * @class SelectUsers.UserItem
 */
var UserItem = React.createClass({

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
        return (
            <label className="UserItem" for={id}>
                <input
                    id={id}
                    type="checkbox"
                    checked={this.props.checked}
                    disabled={this.props.disabled}
                    onChange={this.handleOnChange}
                    ref="checkbox" />
                <span className="first-name" >{this.props.user.get("externalData").first_name + " "}</span>
                <span className="last-name" >{this.props.user.get("externalData").last_name + " "}</span>
                <span className="badge" >{this.props.user.getUsername()}</span>
            </label>
        );
    }
});


var SelectUsers = React.createClass({


    doSearch: function(searchString) {
        var self = this;
        self.cancelCurrentSearch();

        var searchOp = User.search(searchString)
        .then(function(users) {
            self.setState({ searchedUsers: users });
        })
        .catch(Promise.CancellationError, function() {
            // cancel is ok
        })
        .catch(function(err) {
            self.setState({ error: err });
        });

        self.setState({
            error: null,
            searchOp: searchOp
        });
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

    renderSearchError: function() {
        if (!this.state.error) return;
        return (
            <div className="error">
                {this.state.error.message}
            </div>
        );
    },

    getInitialState: function() {
        return {
            error: null,
            searchString: "",
            searchOp: null,
            searchedUsers: [],
            selectedUsers: this.props.currentHandlers
        };
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

    render: function() {
        var self = this;
        return (
            <div className="SelectUsers">
                {self.renderSearchError()}

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
                        <h2>
                            Valitut
                        </h2>
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

                <div className="modal-footer">
                    <Button onClick={self.handleOk}>
                        Lisää käsittelijät
                    </Button>

                    <Button bsStyle="danger" onClick={self.handleOk}>
                        Peruuta
                    </Button>
                </div>

            </div>
        );
    },

});

module.exports = SelectUsers;

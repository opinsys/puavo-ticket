/** @jsx React.DOM */
"use strict";

var _ = require("lodash");
var React = require("react/addons");
var Promise = require("bluebird");

var User = require("../models/client/User");
var Base = require("../models/client/Base");
var UpdateMixin = require("./UpdateMixin");


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
        return (
            <label>
                <input
                    type="checkbox"
                    checked={this.props.checked}
                    disabled={this.props.disabled}
                    onChange={this.handleOnChange}
                    ref="checkbox" />
                <span className="first-name" >{this.props.user.get("external_data").first_name + " "}</span>
                <span className="last-name" >{this.props.user.get("external_data").last_name + " "}</span>      
                <span className="username" >({this.props.user.get("external_data").username})</span>
            </label>
        );
    }
});


var SelectUsers = React.createClass({

    mixins: [UpdateMixin],

    onNavigate: function() {
        this.forceUpdate();
    },

    doSearch: function(searchString) {
        var self = this;
        self.cancelCurrentSearch();

        var searchOp = User.search(searchString)
        .then(function(users) {
            self.setState({ users: users });
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
            users: new Base.Collection(),
            selectedUsers: new Base.Collection(this.props.currentHandlers),
        };
    },

    handleSearchStringChange: function(e) {
        this.setState({ searchString: e.target.value });
        this.bouncedSearch(e.target.value);
    },

    handleSelectUser: function(user) {
        this.state.selectedUsers.add(user);
        this.refs.search.getDOMNode().focus();
    },

    handleRemoveUser: function(user) {
        this.state.selectedUsers.remove(user);
        this.refs.search.getDOMNode().focus();
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
        this.props.onSelect(this.state.selectedUsers);
    },

    render: function() {
        var self = this;
        return (
            <form>
                {self.renderSearchError()}
                    <h2>Lisää käsittelijä</h2>
                    
<a href="#" className="tooltip" title=""><span title="Aloita kirjoittamaan käsittelijän nimeä">
                    
                <input
                    ref="search"
                    value={self.state.searchString}
                    onChange={self.handleSearchStringChange} />
                    
</span></a>
                    
                <div className="selectuser">

                    <ul>
                        {self.state.users.map(function(user) {
                            return (
                                <li key={user.get("external_id")} >
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
                    
                    {self.state.selectedUsers.length > 0 && <h2>    
                        Valitut
                    </h2>}

                    <ul>
                        {self.state.selectedUsers.map(function(user) {
                            return (
                                <li key={user.get("external_id")} >
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

                <button
                    className="button" 
                    onClick={self.handleOk}>ok
                </button>
                
            </form>
        );
    },

});

module.exports = SelectUsers;

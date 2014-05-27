/** @jsx React.DOM */
"use strict";

var _ = require("lodash");
var React = require("react/addons");
var Promise = require("bluebird");

var User = require("../models/client/User");
var Base = require("../models/client/Base");
var UpdateMixin = require("./UpdateMixin");


var SelectUsers = React.createClass({

    mixins: [UpdateMixin],

    onNavigate: function() {
        this.forceUpdate();
    },

    componentWillMount: function() {
        var self = this;
        this.doSearch = _.debounce(function(searchString) {
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

        }, 500);
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
            selectedUsers: new Base.Collection(),
        };
    },

    handleOnChange: function(e) {
        this.setState({ searchString: e.target.value });
        console.log("change", e.target.value);
        this.doSearch(e.target.value);
    },

    handleSelectUser: function(user) {
        this.state.selectedUsers.add(user);
        this.refs.search.getDOMNode().focus();
    },

    handleRemoveUser: function(user) {
        this.state.selectedUsers.remove(user);
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

                <input
                    ref="search"
                    value={self.state.searchString}
                    onChange={self.handleOnChange} />
                <ul>
                    {self.state.users.map(function(user) {
                        return (
                            <li key={user.get("external_id")} onClick={self.handleSelectUser.bind(self, user)}>
                            {user.get("external_data").first_name}
                            {user.get("external_data").last_name}
                            ({user.get("external_data").username})
                            </li>
                        );
                    })}
                </ul>

                <h2>Valitut</h2>

                <ul>
                    {self.state.selectedUsers.map(function(user) {
                        return (
                            <li key={user.get("external_id")} onClick={self.handleRemoveUser.bind(self, user)}>
                            {user.get("external_data").first_name}
                            {user.get("external_data").last_name}
                            ({user.get("external_data").username})
                            </li>
                        );
                    })}
                </ul>

                <button onClick={self.handleOk}>ok</button>

            </form>
        );
    },

});

module.exports = SelectUsers;

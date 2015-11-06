"use strict";

var React = require("react");
var {State} = require("react-router");

var User = require("../models/client/User");
var ProfileDetails = require("./Profile/ProfileDetails");



/**
 * @namespace components
 * @class ProfileDetails
 * @constructor
 * @param {Object} props
 * @param {models.client.User} props.user
 */
var ProfilePage = React.createClass({

    mixins: [State],

    getInitialState() {
        return { user: null };
    },

    componentDidMount() {
        new User({ id: this.props.params.userId })
        .fetch()
        .then(user => {
            if (this.isMounted()) {
                this.setState({user});
            }
        });
    },

    render() {
        if (!this.state.user) return <span>Ladataan...</span>;

        return (
            <div className="ProfilePage">
                <ProfileDetails user={this.state.user} />
            </div>
        );
    },

});

module.exports = ProfilePage;

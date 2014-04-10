/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var _ = require("lodash");

var Lightbox = require("./Lightbox");
var TicketModel = require("../TicketModel");
var SelectUsers = require("./SelectUsers");


var AddUsers = React.createClass({

    propTypes: {
        ticketModel: TicketModel.Type.isRequired
    },

    getInitialState: function() {
        return {
            users: [],
        };
    },

    handleOk: function() {
        this.setState({ saving: true });

        var users = this.state.users.map(function(username) {
            return {
                type: "username",
                value: username + " lisättiin tukipyyntöön"
            };
        });

        this.props.ticketModel.addUpdate(users).then(function() {
            Lightbox.removeCurrentComponent();
        });

    },

    handleUserSelect: function(e) {
        if (e.target.value) {
            this.setState({
                users: _.uniq(this.state.users.concat(e.target.value))
            });
        }

    },

    render: function() {
        return (
            <div>
                <h1>Liitä käyttäjiä tukipyyntöön</h1>
                <p><i>Tähän hieno automaattisesti käyttäjiä hakeva multi select input juttu.</i></p>
                <SelectUsers onChange={this.handleUserSelect} />
                <ul>
                    {this.state.users.map(function(user) {
                        return <li>{user}</li>;
                    })}
                </ul>
                <button onClick={this.handleOk} disabled={!!this.state.saving}>Lisää</button>
            </div>
        );
    }
});

var AddDevices = React.createClass({

    propTypes: {
        ticketModel: TicketModel.Type.isRequired
    },

    handleOk: function() {
        this.props.ticketModel.addUpdate({
            type: "device",
            value: "Laite toimisto-06 liitettiin pyyntöön"
        });
        Lightbox.removeCurrentComponent();
    },

    render: function() {
        return (
            <div>
                <h1>Liitä laitteita tukipyyntöön</h1>
                <p><i>Tähän hieno automaattisesti käyttäjiä hakeva multi select input juttu.</i></p>
                <button onClick={this.handleOk}>OK</button>
            </div>
        );
    }

});

var MetadataButtons = React.createClass({

    propTypes: {
        ticketModel: TicketModel.Type.isRequired
    },

    handleAddUsers: function(e) {
        Lightbox.displayComponent(AddUsers({ ticketModel: this.props.ticketModel }));
    },

    handleAddDevices: function(e) {
        Lightbox.displayComponent(AddDevices({ ticketModel: this.props.ticketModel }));
    },

    render: function() {
        return (
            <div className="metadata">
                Liitä
                <div className="actions" >
                    <button onClick={this.handleAddDevices} className="fa fa-laptop" title="Laite"></button>
                    <button onClick={this.handleAddUsers}className="fa fa-user" title="Käyttäjätunnus"></button>
                    <button className="fa fa-cloud-upload" title="Liitetiedosto"></button>
                    <button className="fa fa-play-circle-o" title="Kuvakaappaus"></button>
                </div>
            </div>
        );
    }
});

module.exports = MetadataButtons;

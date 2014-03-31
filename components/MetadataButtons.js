/** @jsx React.DOM */
var React = require("react/addons");
var Lightbox = require("./Lightbox");
var TicketModel = require("../TicketModel");

var AddUsers = React.createClass({

    propTypes: {
        ticketModel: TicketModel.Type.isRequired
    },

    handleOk: function() {
        this.props.ticketModel.addUpdate({
            type: "username",
            value: "Käyttäjä 'epeli' liitettiin pyyntöön"
        });
        Lightbox.removeCurrentComponent();
    },

    render: function() {
        return (
            <div>
                <h1>Liitä käyttäjiä tukipyyntöön</h1>
                <p><i>Tähän hieno automaattisesti käyttäjiä hakeva multi select input juttu.</i></p>
                <button onClick={this.handleOk}>OK</button>
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

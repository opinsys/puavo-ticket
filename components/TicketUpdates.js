/** @jsx React.DOM */
var React = require("react/addons");
var TicketModel = require("../TicketModel");
var MetadataButtons = require("./MetadataButtons");

var TicketUpdates = React.createClass({

    propTypes: {
        ticketModel: TicketModel.Type.isRequired
    },

    handleAddTextUpdate: function(e) {
        var el = this.refs.updateText.getDOMNode();
        this.props.ticketModel.addUpdate({
            type: "text",
            value: el.value
        });
        el.value = "";
    },

    render: function() {
        return (
            <div>
                <p>Tiedot tukipyynnön etenemisestä</p>

                <ul>
                {this.props.updates.map(function(update) {
                    return <li key={update.value} className="animated bounceInDown">{update.value} - {update.added.toString()}</li>;
                })}
                </ul>

                <input type="text" ref="updateText" />
                <button onClick={this.handleAddTextUpdate}>Lisää päivitys</button>
                <MetadataButtons ticketModel={this.props.ticketModel} />
            </div>
        );
    }
});

module.exports = TicketUpdates;

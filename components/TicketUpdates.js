"use strict";

var React = require("react");
var MetadataButtons = require("./MetadataButtons");

var TicketUpdates = React.createClass({

    handleAddTextUpdate: function(e) {
        var el = this.refs.updateText;
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
                {this.props.updates.map(function(update, i) {
                    return <li key={i} className="animated bounceInDown">{update.value} - {update.added.toString()}</li>;
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

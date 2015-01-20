"use strict";

var Reflux = require("reflux");

var Ticket = require("../models/client/Ticket");
var Actions = require("../Actions");


var TicketStore = Reflux.createStore({

    listenables: Actions.ticket,

    init: function() {
        this.state = {
            ticket: new Ticket(),
            loading: true,
        };
    },

    getInitialState: function() {
        return this.state;
    },

    emitState: function() {
        this.trigger(this.state);
    },

    onChange: function(ticketId) {
        if (String(ticketId) !== String(this.state.ticket.get("id"))) {
            this.state.ticket = new Ticket({ id: ticketId });
            this.state.loading = true;
            this.emitState();
        }
        Actions.refresh();
    },

    onSet: function(ticket) {
        this.state.ticket = ticket;
        this.state.loading = false;
        this.emitState();
    },

});

module.exports = TicketStore;

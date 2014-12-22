"use strict";

var Reflux = require("reflux");

var Ticket = require("app/models/client/Ticket");



/**
 * Refluxjs actions for the curren ticket view
 *
 * https://github.com/spoike/refluxjs
 * @namespace stores
 * @static
 * @class ViewStore.Actions
 */
var Actions = Reflux.createActions([
    "refreshTicket",
    "setTicket",
    "changeTicket",
]);



var TicketStore = Reflux.createStore({

    listenables: Actions,

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

    onChangeTicket: function(ticketId) {
        if (String(ticketId) !== String(this.state.ticket.get("id"))) {
            this.state.ticket = new Ticket({ id: ticketId });
            this.state.loading = true;
            this.emitState();
        }
        Actions.refreshTicket();
    },

    onSetTicket: function(ticket) {
        this.state.ticket = ticket;
        this.state.loading = false;
        this.emitState();
    },

});

TicketStore.Actions = Actions;
module.exports = TicketStore;

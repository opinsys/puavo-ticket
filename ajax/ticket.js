"use strict";

var TicketStore = require("../stores/TicketStore");

var Actions = require("../Actions");



Actions.ticket.fetch.shouldEmit = function() {
    return !!TicketStore.state.ticket.get("id");
};

Actions.ticket.fetch.listen(function refreshTicket() {
    Actions.ajax.read(TicketStore.state.ticket.fetch()
    .catch(Actions.error.haltChain("Tukipyynnön lataus epännistui"))
    .then(Actions.ticket.set));
});

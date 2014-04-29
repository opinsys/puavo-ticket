
var Route = require("../utils/react-route");


module.exports = {
    ticketList: Route.create("/"),
    existingTicket: Route.create("/tickets/:id"),
    newTicket: Route.create(/\/new.*/),

    LinkTicket: Route.createLink("/tickets/:id"),
    LinkNewTicket: Route.createLink("/new"),
    LinkTicketList: Route.createLink("/"),
};



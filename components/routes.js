
var Route = require("../react-route");


module.exports = {
    ticketList: Route.create("/"),
    existingTicket: Route.create("/ticket/:id"),
    newTicket: Route.create(/\/new.*/),

    LinkTicket: Route.createLink("/ticket/:id"),
    LinkNewTicket: Route.createLink("/new"),
    LinkTicketList: Route.createLink("/")
};



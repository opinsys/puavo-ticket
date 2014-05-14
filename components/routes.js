
var Nav = require("../utils/Nav");


module.exports = {
    ticketList: Nav.createRoute("/"),
    existingTicket: Nav.createRoute("/tickets/:id"),
    newTicket: Nav.createRoute(/\/new.*/),

    LinkTicket: Nav.createLink("/tickets/:id"),
    LinkNewTicket: Nav.createLink("/new"),
    LinkTicketList: Nav.createLink("/"),
    LinkLogout: Nav.createLink("/logout")
};



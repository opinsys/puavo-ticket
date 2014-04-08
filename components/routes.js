
var Route = require("../react-route");


module.exports = {
    RouteTicketList: Route.create("/"),
    RouteExisting: Route.create("/ticket/:id"),
    RouteNew: Route.create(/\/new.*/),

    LinkTicket: Route.createLink("/ticket/:id"),
    LinkNewTicket: Route.createLink("/new"),
    LinkTicketList: Route.createLink("/")
};



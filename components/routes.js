
var Route = require("../react-route");


module.exports = {
    RouteTicketList: Route.create("/"),
    RouteExisting: Route.create("/ticket/:uid"),
    RouteNew: Route.create(/\/new.*/),

    LinkTicket: Route.createLink("/ticket/:uid"),
    LinkNewTicket: Route.createLink("/new"),
    LinkTicketList: Route.createLink("/")
};



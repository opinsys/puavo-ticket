
var Route = require("../react-route");


module.exports = {
    RouteExisting: Route.create("/ticket/:uid"),
    RouteNew: Route.create(/\/new.*/),

    TicketLink: Route.createLink("/ticket/:uid"),
    NewTicketLink: Route.createLink("/new")
};



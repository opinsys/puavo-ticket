
var Nav = require("../utils/Nav");

/**
 * Routes and link objects for puavo-ticket
 *
 * @namespace components
 * @class navigation
 */
var navigation = {

    /**
     * Client-side routes
     *
     * @static
     * @property route
     * @type Object
     */
    route: {
        root: Nav.createRoute("/"),
        ticket: {
            existing: Nav.createRoute("/tickets/:id"),
            newForm: Nav.createRoute(/\/new.*/)
        }
    },

    /**
     * Client-side navigation objects. These are instances of `utils.Nav.Link`.
     *
     * @static
     * @property link
     * @type Object
     */
    link: {
        RootLink: Nav.createLink("/"),
        TicketViewLink: Nav.createLink("/tickets/:id"),
        NewTicketLink: Nav.createLink("/new"),
        LogoutLink: Nav.createLink("/logout")
    }
};

module.exports = navigation;

/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var url = require("url");
var Badge = require("react-bootstrap/Badge");

var captureError = require("app/utils/captureError");
var BackboneMixin = require("./BackboneMixin");
var TicketList = require("./TicketList");
var User = require("app/models/client/User");
var Ticket = require("app/models/client/Ticket");

/**
 *
 * @namespace components
 * @class CustomList
 * @constructor
 * @param {Object} props
 */
var CustomList = React.createClass({

    mixins: [BackboneMixin],

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
    },

    getInitialState: function() {
        var u = url.parse(window.location.toString(), true);

        var state = {
            url: []
        };

        if (u.query.tags) {
            state.tags = [].concat(u.query.tags);
            state.tickets = Ticket.collection({
                query: {
                    tags: u.query.tags
                }
            });
        }

        return state;
    },

    componentWillMount: function() {
        if (this.state.tickets) {
            this.state.tickets.fetch()
            .catch(captureError("Ratkaistujen tukipyyntöjen haku epäonnistui"));
        }
    },

    render: function() {
        var user = this.props.user;
        var tickets = this.state.tickets;
        var exampleUrl = "/custom?tags=status:pending|status:open&tags=organisation:toimisto.opinsys.fi";
        var tags = this.state.tags;
        return (
            <div className="CustomList">

                {tickets && <div>
                    <p>
                    Haetaan seuraavilla tageilla
                    </p>

                    <p>
                    {tags.map(function(tags) {
                        return <Badge>{tags.split("|").join(" tai ")}</Badge>;
                    })}
                    </p>

                    <p>
                    Lisää tämä sivu kirjainmerkkeihisi tallentaaksesi sen ;)
                    </p>

                    <TicketList title="Mukautettu listaus" user={user} tickets={tickets.toArray()} />

                </div>}

                {!tickets && <div>
                    <p>
                    Tee mukautettu tukipyyntölista lisäämällä tämän sivun osoitteeseen tags-parametrejä.
                    </p>
                    <p>
                    Esimerkiksi: <a href={exampleUrl}>{exampleUrl}</a>
                    </p>
                </div>}
            </div>
        );
    }
});

module.exports = CustomList;

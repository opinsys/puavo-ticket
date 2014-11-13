/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Link = require("react-router").Link;
var Navigation = require("react-router").Navigation;
var url = require("url");

var app = require("app");
var Ticket = require("app/models/client/Ticket");
var View = require("app/models/client/View");
var Button = require("react-bootstrap/Button");
var ButtonGroup = require("react-bootstrap/ButtonGroup");
var Input = require("react-bootstrap/Input");

var captureError = require("app/utils/captureError");
var BackboneMixin = require("./BackboneMixin");
var Tabs = require("app/components/Tabs");
var TicketList = require("./TicketList");

/**
 * @namespace components
 * @class Views
 * @constructor
 * @param {Object} props
 */
var Views = React.createClass({

    mixins: [BackboneMixin, Navigation],

    getInitialState: function(foo) {
        return {
            tickets: Ticket.collection(),
            views: View.collection()
        };
    },

    componentDidMount: function() {
        var self = this;
        this.fetchViews()
        .then(function() {
            return self.fetchTickets();
        });
    },


    componentWillReceiveProps: function(nextProps) {
        if (this.props.params !== nextProps.params.id) {
            process.nextTick(this.fetchTickets);
        }
    },

    fetchTickets: function() {
        if (!this.isMounted()) return;
        var view = this.getCurrentView();

        var tickets = Ticket.collection([], {
            query: view.get("query")
        });
        this.setBackbone({
            tickets: tickets
        });

        return tickets.fetch()
        .catch(captureError("Tukipyyntöjen haku epäonnistui"));
    },

    fetchViews: function() {
        return this.state.views.fetch()
        .catch(captureError("Näkymien haku epäonnistui"));
    },

    getCurrentView: function() {
        return this.getView(this.props.params.id) || this.generateDefaultView();
    },

    getView: function(id) {
        return this.state.views.findWhere({ id: parseInt(id, 10) });
    },

    generateDefaultView: function() {
        return new View({
            name: "Default",
            query: {
                follower: this.props.user.get("id"),
                tags: [
                    "status:pending|status:open",
                ]
            }
        });
    },

    deleteView: function() {
        var view = this.getCurrentView();
        var self = this;

        return view.destroy()
        .catch(captureError("Näkymän poisto epäonnistui"))
        .then(function() {
            return self.fetchViews();
        })
        .then(function() {
            self.transitionTo("tickets");
        });
    },

    displayShareWindow: function() {
        var self = this;
        var view = this.getCurrentView();
        var u = url.parse(window.location.toString());
        var editUrl = u.protocol + "//" + u.host + self.makePath("view-editor", {name: view.get("name")}, view.get("query"));

        app.renderInModal("Jaa", function(close) {
            return (
                <div className="modal-body">
                    <p>
                        Näkymän asetukset ovat tallennettu tähän osoitteeseen.
                        Lähetä se jakaaksesi näkymän.
                    </p>
                    <Input type="textarea"
                        onChange={function(){/*supress react warning*/}}
                        value={editUrl} />
                    <Button onClick={close} >ok</Button>
                </div>
            );
        });
    },

    render: function() {
        var self = this;
        var views = this.state.views;
        var tickets = this.state.tickets;
        var view = this.getCurrentView();

        return (
            <div className="Views">
                <Tabs>
                    <li>
                        <Link to="tickets">
                            Avoimet
                        </Link>
                    </li>

                    {views.size() > 0 && views.map(function(view) {
                        return <li>
                            <Link to="view" params={{ id: view.get("id") }}>
                                {view.get("name")}
                            </Link>
                        </li>;
                    })}


                    <li>
                        <Link to="view-editor" query={view.get("query")} >+</Link>
                    </li>


                </Tabs>

                <TicketList tickets={tickets.toArray()} />

                {!view.isNew() &&
                <ButtonGroup>
                    <Link className="btn btn-default"
                        to="view-editor"
                        query={view.get("query")}
                        params={{name: view.get("name")}} >Muokkaa</Link>

                    <Button onClick={function(e) {
                        e.preventDefault();
                        self.displayShareWindow();
                    }}>Jaa</Button>

                    <Button bsStyle="danger" onClick={function(e) {
                        e.preventDefault();
                        if (window.confirm("Oikeasti?")) self.deleteView();
                    }}>Poista</Button>

                </ButtonGroup>}

                <div className="clearfix"></div>

            </div>
        );
    }
});

/**
 * @namespace components
 * @class Views.ViewContent
 * @constructor
 * @param {Object} props
 */
var ViewContent = React.createClass({
    render: function() {
        return (
            <div className="ViewContent"></div>
        );
    }
});


Views.View = ViewContent;
module.exports = Views;

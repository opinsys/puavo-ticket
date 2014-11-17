/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Navigation = require("react-router").Navigation;
var Promise = require("bluebird");
var Link = require("react-router").Link;
var Button = require("react-bootstrap/Button");
var ButtonGroup = require("react-bootstrap/ButtonGroup");
var url = require("url");
var Input = require("react-bootstrap/Input");
var _ = require("lodash");

var app = require("app");
var View = require("app/models/client/View");
var Ticket = require("app/models/client/Ticket");
var captureError = require("app/utils/captureError");
var BackboneMixin = require("./BackboneMixin");
var TicketList = require("./TicketList");
var Loading = require("./Loading");

/**
 * @namespace components
 * @class Views
 * @constructor
 * @param {Object} props
 * @param {models.client.View} props.view
 */
var Views = React.createClass({

    propTypes: {
        view: React.PropTypes.instanceOf(View).isRequired,
        onViewDelete: React.PropTypes.func.isRequired,
    },

    mixins: [BackboneMixin, Navigation],

    getInitialState: function(foo) {
        return {
            fetching: false,
            tickets: Ticket.collection(),
        };
    },

    componentDidMount: function() {
        this.fetchTickets();
    },


    componentWillReceiveProps: function(nextProps) {
        console.log("PROPS", this.props.view.get("name"), nextProps.view.get("name"));
        if (!_.isEqual(this.props.view.get("query"),  nextProps.view.get("query"))) {
            console.log("change view", nextProps.view.get("name"));
            process.nextTick(this.fetchTickets);
        }
    },

    fetchTickets: function() {
        if (!this.isMounted()) return;
        if (this.state.fetching && this.state.fetching.isPending()) {
            this.state.fetching.cancel();
        }

        var view = this.props.view;

        var tickets = Ticket.collection([], {
            query: view.get("query")
        });

        var op = tickets.fetch().cancellable();

        this.setState({
            tickets: tickets,
            fetching: op
        });

        var self = this;
        op.then(function(tickets) {
            if (!self.isMounted()) return;
            console.log("SEtting tickets", tickets);
            self.setState({
                tickets: tickets,
                fetching: false
            });
        })
        .catch(Promise.CancellationError, function(err) {
            console.log("Canceled");
        })
        .catch(captureError("Tukipyyntöjen haku epäonnistui"));
    },

    deleteView: function() {
        var view = this.props.view;
        var self = this;

        return view.destroy()
        .catch(captureError("Näkymän poisto epäonnistui"))
        .then(function() {
            self.props.onViewDelete();
        });
    },

    displayShareWindow: function() {
        var self = this;
        var view = this.props.view;
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
        var tickets = this.state.tickets;
        var fetching = this.state.fetching;
        var view = this.props.view;

        return (
            <div className="Views">
                <Loading visible={fetching} />

                <TicketList tickets={tickets.toArray()} />
                <div className="clearfix"></div>
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
            </div>
        );
    },

});

module.exports = Views;

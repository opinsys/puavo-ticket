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
var BackboneMixin = require("./BackboneMixin");
var TicketList = require("./TicketList");
var Loading = require("./Loading");
var ViewActions = require("app/stores/ViewStore").Actions;
var ErrorActions = require("app/stores/ErrorActions");

/**
 * @namespace components
 * @class ViewTabContent
 * @constructor
 * @param {Object} props
 * @param {models.client.View} props.view
 */
var ViewTabContent = React.createClass({

    propTypes: {
        view: React.PropTypes.instanceOf(View).isRequired,
    },

    mixins: [BackboneMixin, Navigation],

    getInitialState: function() {
        return {
            fetching: false,
            tickets: Ticket.collection(),
        };
    },

    componentDidMount: function() {
        this.fetchTickets();
    },


    componentWillReceiveProps: function(nextProps) {
        if (!_.isEqual(this.props.view.get("query"),  nextProps.view.get("query"))) {
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
            self.setState({
                tickets: tickets,
                fetching: false
            });
        })
        .catch(Promise.CancellationError, function(err) {
            // pass
        })
        .catch(ErrorActions.haltChain("Tukipyyntöjen haku epäonnistui"));
    },

    destroyView: function() {
        ViewActions.destroyView(this.props.view);
        app.router.transitionTo("view", {id: "open"});
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
            <div className="ViewTabContent">
                <Loading style={{position: "absolute", top: "5px", right: "5px"}} visible={fetching} />

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
                            if (window.confirm("Oikeasti?")) self.destroyView();
                        }}>Poista</Button>

                </ButtonGroup>}
            </div>
        );
    },

});

module.exports = ViewTabContent;

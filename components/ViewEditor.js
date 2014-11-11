/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var url = require("url");
var _ = require("lodash");
var Badge = require("react-bootstrap/Badge");
var Input = require("react-bootstrap/Input");
var Button = require("react-bootstrap/Button");
var Navigation = require("react-router").Navigation;

var captureError = require("app/utils/captureError");
var BackboneMixin = require("app/components/BackboneMixin");
var TicketList = require("./TicketList");
var User = require("app/models/client/User");
var Ticket = require("app/models/client/Ticket");
var View = require("app/models/client/View");

/**
 *
 * @namespace components
 * @class ViewEditor
 * @constructor
 * @param {Object} props
 */
var ViewEditor = React.createClass({

    mixins: [BackboneMixin, Navigation],

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
    },

    getInitialState: function() {
        var u = url.parse(window.location.toString(), true);

        var state = {
            url: [],
            viewName: ""
        };

        if (u.query.tags) {
            state.tags = [].concat(u.query.tags);
            state.tickets = Ticket.collection([], {
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

    saveView: function() {
        if (!this.isViewOk()) return;
        var view = new View({
            name: this.state.viewName,
            query: this.props.query
        });

        view.save()
        .catch(captureError("Näkymän tallennus epäonnistui"));
    },

    isViewOk: function() {
        return !_.isEmpty(this.props.query) && this.state.viewName;
    },

    setQuery: function(query) {
        this.transitionTo("custom-list", {}, query);
    },

    render: function() {
        var self = this;
        var user = this.props.user;
        var tickets = this.state.tickets;
        var exampleUrl = "/custom?tags=status:pending|status:open&tags=organisation:toimisto.opinsys.fi";
        var tagGroups = this.state.tags;
        return (
            <div className="ViewEditor">

                {tickets && <div>
                    <p>
                    Haetaan seuraavilla tageilla
                    </p>

                    <p>
                    {tagGroups.map(function(tags) {
                        return <Badge>{tags.split("|").join(" tai ")}</Badge>;
                    })}
                    </p>

                    <form>
                        <Input
                            type="text"
                            label="Nimi"
                            onChange={function(e) {
                                self.setState({ viewName: e.target.value });
                            }}
                            onKeyDown={function(e) {
                                if (e.key === "Enter") self.saveView();
                            }}
                        />
                        <Button disabled={!self.isViewOk()} onClick={self.saveView}>Tallenna</Button>
                    </form>

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
                <div className="clearfix"></div>
            </div>
        );
    }
});

module.exports = ViewEditor;

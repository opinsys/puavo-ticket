/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var _ = require("lodash");
var qs = require("querystring");
var Badge = require("react-bootstrap/Badge");
var Input = require("react-bootstrap/Input");
var Button = require("react-bootstrap/Button");
var Router = require("react-router");


var ViewActions = require("../stores/ViewStore").Actions;
var app = require("../index");
var Fa = require("./Fa");
var TicketList = require("./TicketList");
var Ticket = require("../models/client/Ticket");
var BackboneMixin = require("./BackboneMixin");


var queryHelp = <div>
    <p>
    Parempaa käyttöliittymää odotellessa kysely tulee kirjoittaa
    querystring-muodossa käsin. Mahdollisia parametrejä ovat:
    </p>

    <ul>
        <li>
            <b>tags</b> Rajoita hakua tagilla. Tai-ehto voidaan toteuttaa
            tolpalla: <i>tags=foo|bar</i>. Parametri voidaan asettaa useasti: <i>tags=foo|bar&tags=baz</i>
        </li>

        <li>
            <b>text</b> Vapaamuotoinen teksti. Jokainen sana tulee löytyä
            tukipyynnön otsikosta tai jostain kommentista. Sanat eroitellaan +
            merkillä tai välilyönnillä: <i>text=foo+bar</i>
        </li>

        <li>
            <b>follower</b> Rajoita seuraajien mukaan (puavo-ticket userId)
        </li>

    </ul>


</div>;


/**
 *
 * @namespace components
 * @class ViewEditor
 * @constructor
 * @param {Object} props
 */
var ViewEditor = React.createClass({

    mixins: [Router.Navigation, BackboneMixin],

    getInitialState: function() {
        return {
            saving: false,
            name: this.props.params.name,
            queryString: this.parseQueryString(),
        };
    },

    parseQueryString: function() {
        return window.unescape(qs.stringify(this.props.query));
    },

    componentWillMount: function() {
        this.setTicketsDebounced = _.debounce(this.setTickets, 1000);
        this.replaceWithDebounced = _.debounce(this.replaceWith, 300);
    },

    setTickets: function() {
        var tickets = Ticket.collection([], {
            query: this.props.query
        });
        this.setBackbone({ tickets: tickets });
        tickets.fetch();
    },

    componentDidMount: function() {
        if (!_.isEmpty(this.props.query)) {
            this.setTickets();
        }
    },

    componentWillReceiveProps: function(nextProps) {
        if (!_.isEqual(this.props.query, nextProps.query)) {
            this.setTicketsDebounced();
        }
    },

    saveView: function() {
        if (!this.isViewOk()) return;
        this.setState({ saving: true });
        ViewActions.addView({
            name: this.props.params.name,
            query: this.props.query
        }, function(view) {
            app.router.transitionTo("view", {id: view.get("id")});
        });
    },

    isViewOk: function() {
        return !_.isEmpty(this.props.query) && this.props.params.name;
    },

    /**
     * Set query to url path
     *
     * @method setQuery
     * @param {Object|String} query
     */
    setQuery: function(query) {
        var queryString = "";

        if (typeof query === "string") {
            queryString = query;
            query = qs.parse(queryString);
        } else {
            queryString = qs.stringify(query);
        }

        this.setState({ queryString: queryString });
        this.replaceWithDebounced("view-editor", this.props.params, query);
    },

    /**
     * @method setName
     * @param {String} name
     */
    setName: function(name) {
        this.setState({ name: name });
        var params = Object.assign({}, this.props.params, { name: name });
        this.replaceWithDebounced("view-editor", params, this.props.query);
    },

    render: function() {
        var self = this;
        var user = app.currentUser;
        var tickets = this.state.tickets;
        var tagGroups = [].concat(this.props.query.tags).filter(Boolean);
        var saving = this.state.saving;

        return (
            <div className="ViewEditor">
                <h1>Luo uusi näkymä</h1>
                <div>
                    <form>
                        <Input
                            type="text"
                            label="Nimi"
                            className="ViewEditor-name-input"
                            value={this.state.name}
                            onChange={function(e) {
                                self.setName( e.target.value );
                            }}
                        />

                        <Input
                            type="text"
                            label="Kysely"
                            className="ViewEditor-query-input"
                            help={queryHelp}
                            value={self.state.queryString}
                            onChange={function(e) {
                                self.setQuery(e.target.value);
                            }}
                            onKeyDown={function(e) {
                                if (e.key === "Enter") self.setTickets();
                            }}
                        />
                        <Button
                            className="ViewEditor-save-button"
                            disabled={!self.isViewOk() || saving}
                            onClick={self.saveView}>
                            Tallenna
                            {saving && <Fa className="ViewEditor-save-spinner" icon="spinner" spin />}
                        </Button>
                    </form>


                </div>

                <p>
                Haetaan seuraavilla tageilla
                </p>
                <p>
                    {tagGroups.map(function(tags) {
                        return <Badge key={tags} >{tags.split("|").join(" tai ")}</Badge>;
                    })}
                </p>
                {tickets && <div className="ViewEditor-preview">
                    <TicketList title="Mukautettu listaus" user={user} tickets={tickets.toArray()} />
                </div>}

                <div className="clearfix"></div>
            </div>
        );
    }
});

module.exports = ViewEditor;

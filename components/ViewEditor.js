/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var _ = require("lodash");
var qs = require("querystring");
var Badge = require("react-bootstrap/Badge");
var Input = require("react-bootstrap/Input");
var Button = require("react-bootstrap/Button");
var ButtonGroup = require("react-bootstrap/ButtonGroup");
var Router = require("react-router");


var Actions = require("../Actions");
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

    <p>
        Haku palauttaa maksimissaan 99 tukipyyntöä
    </p>


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
            searching: true,
            name: this.props.params.name,
            queryString: this.parseQueryString(),
        };
    },

    parseQueryString: function() {
        return window.unescape(qs.stringify(this.props.query));
    },

    fetchTickets: function() {
        var tickets = Ticket.collection([], {
            query: this.props.query
        });
        this.setBackbone({ tickets: tickets });
        this.setState({ searching: true });

        var op = tickets.fetch();
        Actions.ajax.read(op);
        op.catch(Actions.error.haltChain("Tukipyyntöjen haku epäonnistui"))
        .then(() => this.isMounted() && this.setState({ searching: false }));

    },

    preview: function() {
        if (!this.hasQuery()) return;

        var query = qs.parse(this.state.queryString);
        this.transitionTo("view-editor", {name: this.state.name}, query);
    },

    componentDidMount: function() {
        if (!_.isEmpty(this.props.query)) {
            this.fetchTickets();
        }
    },

    componentDidUpdate: function(prevProps) {
        if (!_.isEqual(this.props.query, prevProps.query)) {
            this.fetchTickets();
        }
    },

    saveView: function() {
        if (!this.isViewOk()) return;
        this.preview();
        this.setState({ saving: true });
        Actions.views.add({
            name: this.props.params.name,
            query: this.props.query
        }, function(view) {
            app.router.transitionTo("view", {id: view.get("id")});
        });
    },

    hasQuery: function() {
        return !_.isEmpty(this.state.queryString);
    },

    isViewOk: function() {
        return this.hasQuery() && this.state.name;
    },

    /**
     * Set query to url path
     *
     * @method setQuery
     * @param {Object|String} query
     */
    setQuery: function(query) {
    },



    render: function() {
        var self = this;
        var user = app.currentUser;
        var tickets = this.state.tickets;
        var tagGroups = [].concat(this.props.query.tags).filter(Boolean);
        var saving = this.state.saving;
        var searching = this.state.searching;


        return (
            <div className="ViewEditor">
                <h1>Luo uusi näkymä</h1>
                <div>
                    <form>
                        <Input
                            type="text"
                            label="Nimi"
                            className="ViewEditor-name-input"
                            onBlur={this.preview}
                            value={this.state.name}
                            onChange={ e => self.setState({name: e.target.value}) }
                            onKeyDown={ e => { if (e.key === "Enter") self.preview() }}
                        />

                        <Input
                            type="textarea"
                            rows="5"
                            label={<span>Kysely{this.state.searching &&
                                <Fa className="ViewEditor-save-spinner" icon="spinner" spin />}</span>}
                            className="ViewEditor-query-input"
                            help={queryHelp}
                            value={self.state.queryString}
                            onBlur={this.preview}
                            onChange={ e => self.setState({queryString: e.target.value}) }
                            onKeyDown={ e => { if (e.key === "Enter") self.preview() }}
                        />

                        <ButtonGroup>
                            <Button
                                className="ViewEditor-save-button"
                                disabled={!self.isViewOk() || saving}
                                onClick={self.saveView}>
                                Tallenna
                                {saving && <Fa className="ViewEditor-save-spinner" icon="spinner" spin />}
                            </Button>

                            <Button
                                className="ViewEditor-preview-button"
                                disabled={!self.hasQuery()}
                                onClick={self.preview}>
                                Esikatsele
                                {searching && <Fa className="ViewEditor-save-spinner" icon="spinner" spin />}
                            </Button>
                        </ButtonGroup>

                    </form>


                </div>

                <hr />

                <p>
                Haetaan seuraavilla tageilla
                </p>
                <ul>
                    {tagGroups.map(tags => <li key={tags} >
                        <span>{tags.split("|").map(tag => <span><Badge>{tag}</Badge></span>)}</span>
                    </li>)}

                </ul>
                {tickets && <div className="ViewEditor-preview">


                    {tickets.size()} kpl
                    <TicketList title="Mukautettu listaus" user={user} tickets={tickets.toArray()} />
                </div>}

                <div className="clearfix"></div>
            </div>
        );
    }
});

module.exports = ViewEditor;

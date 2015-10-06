"use strict";
var React = require("react/addons");
var Navigation = require("react-router").Navigation;
var Link = require("react-router").Link;
var Button = require("react-bootstrap/lib/Button");
var ButtonGroup = require("react-bootstrap/lib/ButtonGroup");
var url = require("url");
var Input = require("react-bootstrap/lib/Input");
var Reflux = require("reflux");

var app = require("../index");
var ViewStore = require("../stores/ViewStore");
var Actions = require("../Actions");
var View = require("../models/client/View");
var TicketList = require("./TicketList");

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

    mixins: [Reflux.connect(ViewStore), Navigation],

    componentDidMount: function() {
        Actions.views.fetchContent(this.props.view);
    },

    componentWillReceiveProps: function(nextProps) {
        if (nextProps.view.get("id") !== this.props.view.get("id")) {
            Actions.views.fetchContent(nextProps.view);
        }
    },

    destroyView: function() {
        Actions.views.destroy(this.props.view);
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
        var tickets = this.state.content;
        var view = this.props.view;

        return (
            <div className="ViewTabContent">

                <TicketList tickets={tickets} />
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

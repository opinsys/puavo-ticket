"use strict";
var React = require("react");
var Navigation = require("react-router").Navigation;
var Link = require("react-router").Link;
var Button = require("react-bootstrap/lib/Button");
var ButtonGroup = require("react-bootstrap/lib/ButtonGroup");
var url = require("url");
var Input = require("react-bootstrap/lib/Input");
var Reflux = require("reflux");
var Modal = require("react-bootstrap/lib/Modal");

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

    getInitialState() {
        return {shareWindowVisible: false};
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
        this.setState({shareWindowVisible: true});
    },

    hideShareWindow() {
        this.setState({shareWindowVisible: false});
    },

    renderModal() {
        var view = this.props.view;
        var u = url.parse(window.location.toString());
        var editUrl = u.protocol + "//" + u.host + this.makePath("view-editor", {name: view.get("name")}, view.get("query"));

        return (
            <Modal show={this.state.shareWindowVisible} onHide={this.hideShareWindow}>
                <Modal.Header closeButton>
                    <Modal.Title>Jaa näkymä</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        <p>
                            Näkymän asetukset ovat tallennettu tähän osoitteeseen.
                            Lähetä se jakaaksesi näkymän.
                        </p>
                        <Input type="textarea"
                            onChange={function(){/*supress react warning*/}}
                            value={editUrl} />
                        <Button onClick={this.hideShareWindow} >ok</Button>
                    </div>
                </Modal.Body>
            </Modal>
        );
    },

    render: function() {
        var tickets = this.state.content;
        var view = this.props.view;

        return (
            <div className="ViewTabContent">
                {this.renderModal()}

                <TicketList tickets={tickets} />
                <div className="clearfix"></div>
                {!view.isNew() &&
                    <ButtonGroup>
                        <Link className="btn btn-default"
                            to="view-editor"
                            query={view.get("query")}
                            params={{name: view.get("name")}} >Muokkaa</Link>

                        <Button onClick={e => {
                            e.preventDefault();
                            this.displayShareWindow();
                        }}>Jaa</Button>

                        <Button bsStyle="danger" onClick={e => {
                            e.preventDefault();
                            if (window.confirm("Oikeasti?")) this.destroyView();
                        }}>Poista</Button>

                </ButtonGroup>}
            </div>
        );
    },

});

module.exports = ViewTabContent;

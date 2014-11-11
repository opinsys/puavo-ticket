/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var Link = require("react-router").Link;

var Ticket = require("app/models/client/Ticket");
var View = require("app/models/client/View");

var BackboneMixin = require("./BackboneMixin");
var Tabs = require("app/components/Tabs");
var Loading = require("app/components/Loading");
var TicketList = require("./TicketList");

/**
 * @namespace components
 * @class Views
 * @constructor
 * @param {Object} props
 */
var Views = React.createClass({
    mixins: [BackboneMixin],

    getInitialState: function() {
        return {
            tickets: Ticket.collection(),
            currentView: this.generateDefaultView(),
            views: View.collection([], { url: "/api/views" })
        };
    },

    componentDidMount: function() {
        this.state.views.fetch();
    },

    componentWillReceiveProps: function(nextProps) {
        var view = null;

        if (!nextProps.params.id && this.props.params) {
            view = this.generateDefaultView();
        } else if (this.props.params !== nextProps.params.id) {
            view = this.getView(nextProps.params.id);
        }

        if (view) {
            var tickets = Ticket.collection([], {
                query: view.get("query")
            });
            this.setBackbone({ tickets: tickets });
            this.setState({ currentView: view });
            tickets.fetch();
        }
    },



    getView: function(id) {
        return this.state.views.findWhere({ id: parseInt(id, 10) });
    },

    generateDefaultView: function() {
        return new View({
            name: "Avoimet",
            query: {
                follower: this.props.user.get("id"),
                tags: [
                    "status:pending|status:open",
                ]
            }
        });
    },

    render: function() {
        var views = this.state.views;
        var tickets = this.state.tickets;
        var view = this.state.currentView;

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
                            <a>+</a>
                        </li>


                    </Tabs>

                    <TicketList tickets={tickets.toArray()} />

                    <Link to="custom-list" query={view.get("query")} >Muokkaa</Link>

                    {view && <pre>
                        {JSON.stringify(view.get("query"))}
                    </pre>}



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

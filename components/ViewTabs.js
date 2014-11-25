/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var Tabs = require("app/components/Tabs");
var Link = require("react-router").Link;
var Navigation = require("react-router").Navigation;

var BackboneMixin = require("./BackboneMixin");
var captureError = require("app/utils/captureError");
var View = require("app/models/client/View");
var Loading = require("./Loading");

/**
 * @namespace components
 * @class ViewTabs
 * @constructor
 * @param {Object} props
 */
var ViewTabs = React.createClass({

    mixins: [BackboneMixin, Navigation],

    getInitialState: function(foo) {
        return {
            views: View.collection()
        };
    },

    fetchViews: function() {
        return this.state.views.fetch()
        .catch(captureError("Näkymien haku epäonnistui"));
    },

    componentDidMount: function() {
        this.fetchViews();
    },


    getView: function(id) {
        if (id === "closed") {
            return this.generateClosedView();
        } else if (id === "open") {
            return this.generateDefaultView();
        }
        return this.state.views.findWhere({ id: parseInt(id, 10) });
    },

    generateDefaultView: function() {
        return new View({
            name: "Open",
            query: {
                follower: this.props.user.get("id"),
                tags: [
                    "status:pending|status:open",
                ]
            }
        });
    },

    generateClosedView: function() {
        return new View({
            name: "Closed",
            query: {
                follower: this.props.user.get("id"),
                tags: [
                    "status:closed"
                ]
            }
        });
    },

    handleViewDelete: function() {
        this.fetchViews();
        this.transitionTo("tickets");
    },

    handleNewView: function(view) {
        this.fetchViews();
        this.transitionTo("view", { id: view.get("id") });
    },

    render: function() {
        var view = this.getView(this.props.params.id);
        var views = this.state.views;
        var user = this.props.user;
        console.log("Current view", view && view.get("name"), this.props.params.id);

        var content = <Loading />;
        if (this.props.name === "view-editor") {
            content = <this.props.activeRouteHandler onNewView={this.handleNewView} />;
        } else if (view) {
            content = <this.props.activeRouteHandler view={view} onViewDelete={this.handleViewDelete} />;
        }

        return (
            <div className="ViewTabs">
                <Tabs>
                    <li>
                        <Link to="view" params={{id: "open"}}>
                            Avoimet
                        </Link>
                    </li>
                    <li>
                        <Link to="view" params={{id: "closed"}}>
                            Ratkaistut
                        </Link>
                    </li>

                    {user.acl.canCreateCustomTabs() && views.size() > 0 && views.map(function(view) {
                        return <li key={view.get("id")}>
                            <Link to="view" params={{ id: view.get("id") }}>
                                {view.get("name")}
                            </Link>
                        </li>;
                    })}


                    {user.acl.canCreateCustomTabs() && <li>
                        <Link to="view-editor" query={view && view.get("query")} >+</Link>
                    </li>}

                </Tabs>

                {content}

            </div>
        );
    }
});

module.exports = ViewTabs;

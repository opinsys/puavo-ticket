/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var Tabs = require("app/components/Tabs");
var Link = require("react-router").Link;
var State = require("react-router").State;
var RouteHandler = require("react-router").RouteHandler;
var Reflux = require("reflux");

var app = require("app");
var Loading = require("./Loading");
var ViewStore = require("app/stores/ViewStore");
var ViewActions = require("app/actions").ViewActions;

/**
 * @namespace components
 * @class ViewTabs
 * @constructor
 * @param {Object} props
 */
var ViewTabs = React.createClass({

    mixins: [Reflux.connect(ViewStore), State],

    componentDidMount: function() {
        ViewActions.loadViews();
    },

    render: function() {
        var self = this;
        var view = ViewStore.getView(this.props.params.id);
        var views = this.state.views;
        var user = app.currentUser;


        var content = <Loading />;

        if (this.isActive("view-editor")) {
            content = <RouteHandler params={self.props.params} query={self.props.query} />;
        } else if (!this.state.loading && !view) {
            content = "Tuntematon näkymä";
        } else if (view) {
            content = <RouteHandler view={view} params={self.props.params} query={self.props.query} />;
        }

        return (
            <div className="ViewTabs">
                <Tabs>

                    {views.map(function(view) {
                        return <li key={view.get("id")}>
                            <Link to="view" params={{ id: view.get("id") || "WTF" }}>
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

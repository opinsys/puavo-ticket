
import "babel/polyfill";
import React from "react";
import Bluebird from "bluebird";
import { history } from "react-router/lib/BrowserHistory";
import {Router, Route, Link} from 'react-router';
import Fluxible from "fluxible";
import FluxibleComponent from "fluxible-addons-react/FluxibleComponent";
import connectToStores from "fluxible-addons-react/connectToStores";
import provideContext from "fluxible-addons-react/provideContext";

import Main from "./components/Main";
import ViewList from "./components/ViewList";
import ViewContent from "./components/ViewContent";

import ViewStore from "./stores/ViewStore";
import AjaxStore from "./stores/AjaxStore";
import {fetchViews} from "./actions/ViewActions";
import {fetchTickets} from "./actions/TicketActions";



class Foo extends React.Component {
    static beforeNavigate() {
        console.log("foo loading");
    }

    render() {
        return <span><Link to="/bar">Go to bar</Link></span>;
    }
}

class Bar extends React.Component {
    static beforeNavigate() {
        console.log("bar loading");
    }

    render() {
        return <span><Link to="/foo">Go to foo</Link></span>;
    }
}


const ViewList_ = connectToStores(ViewList, [ViewStore], (context) => {
    return {
        views: context.getStore(ViewStore).state.views
    };
});

const ViewContent_ = connectToStores(ViewContent, [ViewStore], (context, props) => {

    return {
    };
});

class DefaultPanels extends React.Component {
    render() {
        return <Main leftPanel={<ViewList_ />} {...this.props} />;
    }
}

var app = new Fluxible({
    component: DefaultPanels
});

app.registerStore(ViewStore);
app.registerStore(AjaxStore);

var context = app.createContext();
window.context = context;

var viewsPromise = context.executeAction(fetchViews);

var routes = {
    path: "/",
    onEnter: () => viewsPromise,
    component: context.getComponent(),
    childRoutes: [
        {
            path: "views/:id",
            onEnter: (props) => viewsPromise.then(() => {
                const viewStore = context.getStore(ViewStore);
                const view = viewStore.getView(props.params.id);
                return context.executeAction(fetchTickets, {query: view.query});
            }),
            components: {
                leftPanel: ViewList_,
                body: ViewContent_
            }
        }

    ]
};



React.render(
    <FluxibleComponent context={context.getComponentContext()}>
        <Router history={history} children={routes} />
    </FluxibleComponent>
    , document.getElementById(("app")), () => {
        document.body.removeChild(document.getElementById("spinner"));
});

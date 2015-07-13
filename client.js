
import "babel/polyfill";
import React from "react";
import Bluebird from "bluebird";
import { history } from "react-router/lib/BrowserHistory";
import {Router, Route, Link} from 'react-router';
import Fluxible from "fluxible";
import FluxibleComponent from "fluxible-addons-react/FluxibleComponent";

// import Main from "./components/Main";
import Layout from "./components/Layout";
import ViewList from "./components/ViewList";
import ViewStore from "./stores/ViewStore";
import {fetchViews} from "./actions/ViewActions";
console.log("fetchViews", fetchViews);


var app = new Fluxible({
    component: Layout
});

app.registerStore(ViewStore);


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

var context = app.createContext();
window.context = context;

class Main extends React.Component {
    render() {
        return (
            <FluxibleComponent context={context.getComponentContext()}>
                <Layout {...this.props} />
            </FluxibleComponent>
        );
    }
}

// const ViewList_ = connectStores(ViewList, {
//     stores: {viewList: ViewList},
//     actions: 
// }

var routes = {
    path: "/",
    onEnter: () => context.executeAction(fetchViews),
    component: Main,
    childRoutes: [
        {
            path: "foo",
            components: {
                leftPanel: ViewList,
                body: Foo
            }
        },
        {
            path: "bar",
            components: {
                leftPanel: ViewList,
                body: Bar
            }
        }

    ]
};


React.render(<Router history={history} children={routes} />, document.getElementById(("app")), () => {
    document.body.removeChild(document.getElementById("spinner"));
});

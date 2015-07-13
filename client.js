
import "babel/polyfill";
import React from "react";
import Bluebird from "bluebird";
import { history } from 'react-router/lib/BrowserHistory';
import {Router, Route, Link} from 'react-router';

import Main from "./components/Main";


class Foo extends React.Component {
    static beforeNavigate() {
        console.log("foo loading");
    }

    render() {
        return <span>foo</span>;
    }
}

class Bar extends React.Component {
    static beforeNavigate() {
        console.log("bar loading");
    }

    render() {
        return <span>bar 2 </span>;
    }
}



var routes = {
    path: "/",
    component: Main,
    childRoutes: [
        { path: "foo", component: Foo },
        { path: "bar", component: Bar }

    ]
};


React.render(<Router history={history} children={routes} />, document.getElementById(("app")), () => {
    document.body.removeChild(document.getElementById("spinner"));
});

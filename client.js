
import "babel/polyfill";
import React from "react";
import Bluebird from "bluebird";
import { history } from "react-router/lib/BrowserHistory";
import {Router, Route, Link} from 'react-router';
import Fluxible from "fluxible";
import FluxibleComponent from "fluxible-addons-react/FluxibleComponent";
import connectToStores from "fluxible-addons-react/connectToStores";
import PureComponent from "react-pure-render/component";
import debug from "debug";
window.debug = debug;

import Main from "./components/Main";
import ViewList from "./components/ViewList";
import ViewContent from "./components/ViewContent";
import TicketComments from "./components/TicketComments";

import ViewStore from "./stores/ViewStore";
import AjaxStore from "./stores/AjaxStore";
import TicketStore from "./stores/TicketStore";
import CommentsStore from "./stores/CommentsStore";
import {fetchViews} from "./actions/ViewActions";
import {fetchTickets} from "./actions/TicketActions";




const ViewList_ = connectToStores(ViewList, [ViewStore], (context) => {
    return {
        views: context.getStore(ViewStore).state.views
    };
});

const ViewContent_ = connectToStores(ViewContent, [ViewStore, TicketStore], (context, props) => {
    const viewStore = context.getStore(ViewStore);
    const viewId = props.params.id;
    return {
        tickets: viewStore.getTicketsForView(viewId)
    };
});

const TicketComments_ = connectToStores(TicketComments, [CommentsStore], (context, props) => {
    let comments = context.getStore(CommentsStore).getComments(props.params.ticketId);
    return {comments};
});


const ViewHeader = connectToStores(class ViewHeader extends PureComponent {
    render() {
        return <h1>{this.props.name}</h1>;
    }
}, [ViewStore], (context, props) => ({
    name: context.getStore(ViewStore).getView(props.params.id).name
}));



class DefaultPanels extends PureComponent {
    render() {
        return <Main leftPanel={<ViewList_ />} {...this.props} />;
    }
}

var app = new Fluxible({
    component: DefaultPanels
});

app.registerStore(ViewStore);
app.registerStore(AjaxStore);
app.registerStore(TicketStore);
app.registerStore(CommentsStore);

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
            onEnter: (nextState, transition, cb) => viewsPromise.then(() => {
                const viewStore = context.getStore(ViewStore);
                const view = viewStore.getView(nextState.params.id);
                return context.executeAction(fetchTickets, {
                    query: view.query,
                    viewId: nextState.params.id
                })
                .then(() => cb());
            }),
            components: {
                header: ViewHeader,
                leftPanel: ViewList_,
                body: ViewContent_
            }
        },
        {
            path: "tickets/:ticketId",
            components: {
                leftPanel: ViewList_,
                body: TicketComments_
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

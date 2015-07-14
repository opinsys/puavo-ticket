

import React from "react";
import connectToStores from "fluxible-addons-react/connectToStores";

import Layout from "./Layout";
import Loading from "./Loading";
import AjaxStore from "../stores/AjaxStore";

const Loading_ = connectToStores(Loading, [AjaxStore], (context) => {
    var s = context.getStore(AjaxStore);
    return {visible: s.isActive()};
});

export default class Main extends React.Component {

    render() {
        return (
            <div className="Main">
                <Loading_ />
                <Layout {...this.props} />
            </div>
        );
    }

}


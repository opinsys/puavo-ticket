

import React from "react";
import {Link} from "react-router";
import _ from "lodash";
import lorem from "lorem-ipsum";

import Layout from "./Layout";

export default class Main extends React.Component {

    render() {
        return (
            <div>

                 <Layout
                    header={<h4>header text sadf sdaf sda dfsa sdaf dasf</h4>}
                    footer={<div>footer jee</div>}
                    leftPanelWidth={200}
                    leftPanel={
                        <ul>
                            {_.range(400).map(i => <li>{i} foo</li>)}
                        </ul>}

                    rightPanelWidth={400}
                    rightPanel={
                        <ul>
                            {_.range(1000, 1200).map(i => <li>{i} foo</li>)}
                        </ul>}

                >

                    <div className="row">
                        <div className="col-md-6">
                            eka
                        </div>
                        <div className="col-md-6">
                            toka
                        </div>
                    </div>
                    
                    <h1>Hello</h1>
                    <p>
                        {lorem({count: 40})}
                    </p>
                    <p>
                        {lorem({count: 40})}
                    </p>
                    <p>
                        {lorem({count: 40})}
                    </p>



                </Layout>

            </div>
        );
    }

}


Main.propTypes = {
    children: React.PropTypes.element
};

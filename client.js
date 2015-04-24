"use strict";

var lorem = require("lorem-ipsum");
var React = require("react");
var _ = require("lodash");
var Navbar = require("react-bootstrap/lib/Navbar");
var Nav = require("react-bootstrap/lib/Nav");
var NavItem = require("react-bootstrap/lib/NavItem");
var Row = require("react-bootstrap/lib/Row");
var Col = require("react-bootstrap/lib/Col");


var Enquire = require("./Enquire");

var Main = React.createClass({
    render: function() {
        return (
            <div className="Main">
                <Navbar brand="Opinsys" fluid fixedTop>
                    <Nav>
                        <NavItem>
                            test
                        </NavItem>
                    </Nav>

                </Navbar>

                <div>
                        <div className="pt-sidebar-left pt-panel pt-sidebar">
                            <ul>
                                {_.range(400).map(i => <li>{i} foo</li>)}
                            </ul>
                        </div>

                        <div className="pt-main pt-panel" >

                            <h1>Hello</h1>
                            <p>
                                {lorem({count: 40})}
                            </p>
                        </div>

                        <div className="pt-sidebar-right pt-panel pt-sidebar">
                            <ul>
                                {_.range(1000, 1200).map(i => <li>{i} foo</li>)}
                            </ul>
                        </div>
                </div>

            </div>
        );
    }
});

React.render(<Main />, document.body);

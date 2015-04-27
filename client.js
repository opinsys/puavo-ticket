"use strict";

var lorem = require("lorem-ipsum");
var React = require("react");
var _ = require("lodash");
var Navbar = require("react-bootstrap/lib/Navbar");
var Nav = require("react-bootstrap/lib/Nav");
var NavItem = require("react-bootstrap/lib/NavItem");
var Row = require("react-bootstrap/lib/Row");
var Col = require("react-bootstrap/lib/Col");
var Glyphicon = require("react-bootstrap/lib/Glyphicon");


var Enquire = require("./Enquire");

var Layout = React.createClass({

    propTypes: {
        header: React.PropTypes.object.isRequired,
        headerHeight: React.PropTypes.number,
        leftPanel: React.PropTypes.object.isRequired,
        rightPanel: React.PropTypes.object.isRequired,
        leftPanelWidth: React.PropTypes.number.isRequired,
        rightPanelWidth: React.PropTypes.number.isRequired,
    },

    getDefaultProps() {
        return {
            headerHeight: 50
        };
    },

    getInitialState() {
        return {
            showRightPanel: true,
            showLeftPanel: true,
            forceRight: false,
            forceLeft: false
        };
    },

    updateDimensions() {
        var diff = window.innerWidth - (
            this.props.rightPanelWidth + this.props.leftPanelWidth
        );

        this.setState(this.getInitialState());

        if (diff < 480) {
            this.setState({showRightPanel: false});
        }

        diff = window.innerWidth - this.props.leftPanelWidth;

        if (diff < 480) {
            this.setState({showLeftPanel: false});
        }

    },

    componentDidMount() {
        this._updateDimensions = _.throttle(this.updateDimensions, 200);
        window.addEventListener("resize", this._updateDimensions);
        this.updateDimensions();
    },

    componentWillUnmount() {
        window.removeEventListener("resize", this._updateDimensions);
    },

    forceShowLeftPanel() {
        this.updateDimensions();
        this.setState({forceLeft: true});
    },

    forceShowRightPanel() {
        this.updateDimensions();
        this.setState({forceRight: true});
    },

    render() {
        var {
            headerHeight,
            leftPanel, rightPanel,
            leftPanelWidth, rightPanelWidth
        } = this.props;

        var {showLeftPanel, showRightPanel, forceRight, forceLeft} = this.state;

        var contentLeftMargin = leftPanelWidth;
        var contentRightMargin = rightPanelWidth;

        if (!showRightPanel) {
            contentRightMargin = 0;
        }

        if (!showLeftPanel) {
            contentLeftMargin = 0;
        }

        if (forceRight) showRightPanel = true;
        if (forceLeft) showLeftPanel = true;

        var showOverlay = (forceRight || forceLeft);

        return (
            <div className="Layout">

                <div className="pt-header" style={{
                    left: contentLeftMargin,
                    right: contentRightMargin,
                    height: headerHeight
                }}>
                    {this.props.header}
                </div>

                {!showLeftPanel &&
                    <button
                        className="pt-panel-force-btn btn"
                        onClick={this.forceShowLeftPanel}
                        style={{position: "absolute", left: 0}}>
                        <Glyphicon glyph='forward' />
                    </button>
                }

                {!showRightPanel &&
                    <button
                        className="pt-panel-force-btn btn"
                        onClick={this.forceShowRightPanel}
                        style={{position: "absolute", right: 0}}>
                        <Glyphicon glyph='backward' />
                    </button>
                }


                {showLeftPanel &&
                <div className="pt-sidebar-left pt-panel pt-sidebar" style={{width: leftPanelWidth}}>
                    {leftPanel}
                </div>}

                {showRightPanel &&
                <div className="pt-sidebar-right pt-panel pt-sidebar" style={{width: rightPanelWidth, right: 0}}>
                    {rightPanel}
                </div>}

                {showOverlay &&
                <div className="pt-main-overlay pt-panel" onClick={this.updateDimensions}></div>}

                <div className="pt-main pt-panel"
                    style={{
                        marginTop: headerHeight,
                        left: contentLeftMargin,
                        right: 0,
                        marginRight: contentRightMargin
                    }} >
                    {this.props.children}
                </div>}


            </div>

        );
    }

});

var Main = React.createClass({
    render() {
        return (
            <div className="Main">
                <Navbar brand="Opinsys" toggleNavKey={0} >
                    <Nav right eventKey={0}>
                        <NavItem>
                            test
                        </NavItem>
                        <NavItem>
                            test2
                        </NavItem>
                    </Nav>

                </Navbar>

                <Layout
                    header={<h4>header text sadf sdaf sda dfsa sdaf dasf</h4>}
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
});

React.render(<Main />, document.body);

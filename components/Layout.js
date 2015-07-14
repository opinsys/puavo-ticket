
import React from "react";
import PureComponent from "react-pure-render/component";
import throttle from "lodash/function/throttle";
import Glyphicon from "react-bootstrap/lib/Glyphicon";



export default class Layout extends PureComponent {

    constructor(props) {
        super(props);
        this.state = this.createInitialState();
    }

    createInitialState() {
        return {
            showRightPanel: true,
            showLeftPanel: true,
            forceRight: false,
            forceLeft: false
        };
    }

    updateDimensions() {
        var diff = window.innerWidth - (
            this.props.rightPanelWidth + this.props.leftPanelWidth
        );

        this.setState(this.createInitialState());

        if (diff < 480) {
            this.setState({showRightPanel: false});
        }

        diff = window.innerWidth - this.props.leftPanelWidth;

        if (diff < 480) {
            this.setState({showLeftPanel: false});
        }

    }

    componentDidMount() {
        this._updateDimensions = throttle(this.updateDimensions.bind(this), 200);
        window.addEventListener("resize", this._updateDimensions);
        this.updateDimensions();
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this._updateDimensions);
    }

    forceShowLeftPanel() {
        this.updateDimensions();
        this.setState({forceLeft: true});
    }

    forceShowRightPanel() {
        this.updateDimensions();
        this.setState({forceRight: true});
    }

    render() {
        var {
            footerHeight,
            headerHeight,
            leftPanel, rightPanel,
            leftPanelWidth, rightPanelWidth
        } = this.props;

        var {showLeftPanel, showRightPanel, forceRight, forceLeft} = this.state;

        if (!leftPanel) showLeftPanel = false;
        if (!rightPanel) showRightPanel = false;

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

                <div className="pt-header container-fluid" style={{
                    left: contentLeftMargin,
                    right: contentRightMargin,
                    height: headerHeight
                }}>
                    {this.props.header}
                </div>


                {!showLeftPanel && leftPanel &&
                    <button
                        className="pt-panel-force-btn btn"
                        onClick={this.forceShowLeftPanel.bind(this)}
                        style={{position: "absolute", left: 0}}>
                        <Glyphicon glyph="forward" />
                    </button>
                }

                {!showRightPanel && rightPanel &&
                    <button
                        className="pt-panel-force-btn btn"
                        onClick={this.forceShowRightPanel.bind(this)}
                        style={{position: "absolute", right: 0}}>
                        <Glyphicon glyph="backward" />
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
                <div className="pt-main-overlay pt-panel" onClick={this.updateDimensions.bind(this)}></div>}

                <div className="pt-main pt-panel container-fluid"
                    style={{
                        marginTop: headerHeight,
                        left: contentLeftMargin,
                        right: 0,
                        marginBottom: footerHeight,
                        marginRight: contentRightMargin
                    }} >
                    {this.props.body || this.props.children}
                </div>

                {this.props.footer &&
                <div className="pt-footer container-fluid" style={{
                    height: footerHeight,
                    left: contentLeftMargin,
                    right: contentRightMargin
                }}>
                    {this.props.footer}
                </div>}


            </div>
        );
    }

}

Layout.contextTypes = {
    getStore: React.PropTypes.func.isRequired
};

Layout.propTypes = {
    children: React.PropTypes.element,
    body: React.PropTypes.element,
    header: React.PropTypes.element,
    headerHeight: React.PropTypes.number,
    footer: React.PropTypes.element,
    footerHeight: React.PropTypes.number,
    leftPanel: React.PropTypes.element,
    rightPanel: React.PropTypes.element,
    leftPanelWidth: React.PropTypes.number,
    rightPanelWidth: React.PropTypes.number
};

Layout.defaultProps = {
    leftPanelWidth: 200,
    rightPanelWidth: 200,
    headerHeight: 50,
    footerHeight: 100
};

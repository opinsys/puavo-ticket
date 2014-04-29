/** @jsx React.DOM */
"use strict";
var React = require("react");

/**
 * Render React component in a modal lightbox
 *
 * @namespace components
 * @class Lightbox
 * @extends React.ReactComponent
 */
var Lightbox = React.createClass({
    render: function() {
        return (
            <div>
                <div onClick={Lightbox.removeCurrentComponent} className="lightbox-bg"></div>
                <div className="lightbox">
                    <div className="lightbox-wrap">
                        {this.props.children}
                    </div>
                </div>
            </div>
        );
    }
});

/**
 * Currently visible rendered component
 *
 * @static
 * @private
 * @property currentComponent
 * @type React.ReactComponent|null
 */
Lightbox.currentComponent = null;

/**
 * Container where the lightbox root is rendered to
 *
 * @static
 * @private
 * @property container
 * @type DOMElement
 */
Lightbox.container = document.getElementById("lightbox-container");

/**
 * @static
 * @method displayComponent
 * @param component {React.ReactComponent}
 */
Lightbox.displayComponent = function (component) {
    if (Lightbox.currentComponent) Lightbox.removeCurrentComponent();
    Lightbox.currentComponent = component;
    React.renderComponent(
        <Lightbox>{component}</Lightbox>,
        Lightbox.container
    );
    document.body.scrollTop = document.documentElement.scrollTop = 0;
};

/**
 * Remove current component from the view
 *
 * @static
 * @method removeCurrentComponent
 */
Lightbox.removeCurrentComponent = function() {
    if (!Lightbox.currentComponent) return;
    React.unmountComponentAtNode(Lightbox.container);
    Lightbox.currentComponent = null;
};

module.exports = Lightbox;

/** @jsx React.DOM */
var React = require("react");

var Lightbox = React.createClass({
    render: function() {
        return (
            <div>
                <div className="lightbox-bg"></div>
                <div className="lightbox">
                    <div className="lightbox-wrap">
                        {this.props.children}
                    </div>
                </div>
            </div>
        );
    }
});

Lightbox.currentComponent = null;

Lightbox.container = document.getElementById("lightbox-container");

Lightbox.displayComponent = function (component) {
    if (Lightbox.currentComponent) Lightbox.removeCurrentComponent();
    Lightbox.currentComponent = component;
    React.renderComponent(
        <Lightbox>{component}</Lightbox>,
        Lightbox.container
    );
    document.body.scrollTop = document.documentElement.scrollTop = 0;
};

Lightbox.removeCurrentComponent = function() {
    if (!Lightbox.currentComponent) return;
    React.unmountComponentAtNode(Lightbox.container);
    Lightbox.currentComponent = null;
};

module.exports = Lightbox;


var React = require("react");
var hoistNonReactStatics = require("hoist-non-react-statics");

function propsTransform(Component, transformFn) {
    var PropsTransformer = React.createClass({
        displayName: (Component.displayName || Component.name) + "PropsTransformer",
        render: function() {
            return React.createElement(Component, transformFn(this.props));
        }
    });
    hoistNonReactStatics(PropsTransformer, Component);
    return PropsTransformer;
}

module.exports = propsTransform;

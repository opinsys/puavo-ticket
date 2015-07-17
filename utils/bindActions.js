
var React = require("react");
var hoistNonReactStatics = require("hoist-non-react-statics");


function bindActions(Component, actions) {


    var ActionBinder = React.createClass({

        displayName: (Component.displayName || Component.name) + "ActionBinder",

        contextTypes: {
            executeAction: React.PropTypes.func.isRequired
        },

        componentWillMount: function() {
            this.actionProps = {};
            var self = this;
            Object.keys(actions).forEach(function(propName) {
                var action = actions[propName];
                self.actionProps[propName] = self.context.executeAction.bind(self.context, action);
            });
        },

        render: function() {
            return React.createElement(Component, Object.assign({}, this.props, this.actionProps));
        }

    });

    hoistNonReactStatics(ActionBinder, Component);
    return ActionBinder;
}

module.exports = bindActions;

"use strict";

var React = require("react/addons");
var Button = require("react-bootstrap/lib/Button");
var Fa = require("./Fa");


/**
 * @namespace components
 * @class EditableList
 * @constructor
 * @param {Object} props
 */
var EditableList = React.createClass({
    render: function() {
        return (
            <ul className="EditableList">
                {this.props.children}
            </ul>
        );
    }
});

/**
 * @namespace components
 * @class EditableList.Item
 * @constructor
 * @param {Object} props
 * @param {Object} props.onRemove
 */
var Item = React.createClass({

    propTypes: {
        className: React.PropTypes.string,
        onRemove: React.PropTypes.func,
        permanent: React.PropTypes.bool,
        disabled: React.PropTypes.bool,
    },

    getInitialState: function() {
        return {
            removePending: false
        };
    },


    render: function() {
        var self = this;
        var className = "Item " + this.props.className;
        var disabled = !!this.props.disabled;
        var pending = this.state.removePending;
        return (
            <li className={className}>
                {!this.props.permanent && <Button className="remove-button"
                        bsStyle="danger"
                        bsSize="xsmall"
                        disabled={pending || disabled}
                        onClick={function() {
                            self.setState({ removePending: true });
                            self.props.onRemove(self.props);
                        }}>
                        {pending ? <Fa icon="spinner" spin={true} />  : <Fa icon="times" /> }
                    </Button>}
                {this.props.children}
            </li>
        );
    }
});

EditableList.Item = Item;
module.exports = EditableList;

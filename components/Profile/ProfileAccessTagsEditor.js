"use strict";

var React = require("react/addons");
var Badge = require("react-bootstrap/Badge");
var Input = require("react-bootstrap/Input");
var Button = require("react-bootstrap/Button");
var User = require("../../models/client/User");


var ProfileAccessTagsEditor = React.createClass({

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
    },

    getInitialState() {
        return { newTag: "" };
    },

    _addNewTag() {
        this.props.user.addAccessTag(this.state.newTag)
        .then(() => {
            this.setState({ newTag: "" });
            alert("Ok, lataa sivu uusiksi...");
        })
        .catch(() => alert("fail"));
    },

    render() {
        return (
            <div className="ProfileAccessTagsEditor" style={{maxWidth: "400px"}}>
                <h3>Pääsytagit</h3>
                {this.props.user.toJSON().accessTags.map(at => {
                    return <span><Badge key={at.id}>{at.tag}</Badge></span>;
                })}
                <Input
                    label="Uusi"
                    type="text"
                    value={this.state.newTag}
                    onChange={e => this.setState({ newTag: e.target.value })} />
                <Button onClick={this._addNewTag}>Lisää</Button>
            </div>
        );
    },

});

module.exports = ProfileAccessTagsEditor;

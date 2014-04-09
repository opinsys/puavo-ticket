/** @jsx React.DOM */
var React = require("react/addons");

var SelectUsers = React.createClass({

    render: function() {
        return (
            <select onChange={this.props.onChange}>
                <option value="">valitse...</option>
                <option value="hannele">Hannele</option>
                <option value="petri">Petri</option>
                <option value="antti">Antti</option>
                <option value="mikko">Mikko</option>
                <option value="esa">Esa</option>
                <option value="tuomas">Tuomas</option>
                <option value="juha">Juha</option>
            </select>
        );
    },

});

module.exports = SelectUsers;

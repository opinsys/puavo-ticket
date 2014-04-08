/** @jsx React.DOM */
var React = require("react/addons");

var SimilarTickets = React.createClass({

    render: function() {
        if (this.props.ticketModel.get("title").length < 5) return <noscript />;
        if (this.props.ticketModel.get("description").length < 5) return <noscript />;
        return (
            <div className="animated fadeIn similar-tickets">
                <h2>Samankaltaiset tukipyynnöt</h2>
                <ul>
                    <li>
                        <a href="#">xmoto ei löydy menusta</a>
                    </li>
                    <li>
                        <a href="#">bsdgames paketin asennus</a>
                    </li>
                    <li>
                        <a href="#">milloin tulee trusty</a>
                    </li>
                </ul>
                <p>
                    Ethän avaa toista tukipyyntöä samasta aiheesta. Kiitos.
                </p>
            </div>
        );
    },

});

module.exports = SimilarTickets;

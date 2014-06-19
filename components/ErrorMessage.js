/** @jsx React.DOM */
"use strict";

var React = require("react/addons");

/**
 * ErrorMessage
 *
 * @namespace components
 * @class ErrorMessage
 */
var ErrorMessage = React.createClass({
    render: function() {
        return (
            <div className="ErrorMessage">
                <p>
                    Lataa sivu uusiksi ja yritä uudelleen. Jos ongelma ei poistu
                    ota yhteyttä puhelimitse tukeen.
                </p>

                <h2>Viesti</h2>

                <pre>
                    {this.props.error.message}
                </pre>

                {this.props.error.stack &&
                    <div>
                        <h2>Stack trace</h2>
                        <pre>
                            {this.props.error.stack}
                        </pre>
                    </div>
                }

            </div>
        );
    }
});


module.exports = ErrorMessage;

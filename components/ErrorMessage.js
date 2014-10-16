/** @jsx React.DOM */
"use strict";

var React = require("react/addons");

function mailtoEscape(value) {
    // borrowed from https://github.com/oncletom/mailto/blob/02aa8796cf6e2a0d66276693bab57e892dd0f7c1/lib/mailto.js#L120
    // fixing *nix line break encoding to follow RFC spec
    return encodeURIComponent(value).replace(/%0A(?!%)/g, '%0D%0A');
}

function isjQueryAjaxError(err) {
    return err && typeof err.pipe === "function";
}

/**
 * Render instructions for the user on how to report an unexpected error to the
 * developers
 *
 * @namespace components
 * @class ErrorMessage
 * @constructor
 * @param {Object} props
 * @param {Object} props.error Error object to be rendered
 */
var ErrorMessage = React.createClass({

    propTypes: {
        error: React.PropTypes.object.isRequired
    },

    mail: {
        to: "dev@opinsys.fi",
        subject: "Ongelma tukipalvelussa"
    },

    statics: {
        /**
         * Format the error object to email suitable string
         *
         * @static
         * @method formatError
         * @param {Error} error
         * @param {String} errorSource
         * @return {String}
         */
        formatError: function(error, errorSource) {
            var errorDetails = [];

            if (isjQueryAjaxError(error)) {
                errorDetails.push({ key: "Server error", value: error.responseText });
                errorDetails.push({ key: "Status", value: error.status });
                errorDetails.push({ key: "Status Code", value: error.statusCode() });
            } else {
                errorDetails.push({ key: "Virhe", value: error.message });
                errorDetails.push({ key: "Stack", value: error.stack });
            }

            errorDetails.push({ key: "Selain", value: window.navigator.userAgent });
            errorDetails.push({ key: "URL", value: window.location.toString() });

            if (errorSource) {
                errorDetails.push({ key: "Error Source", value: errorSource });
            }

            return errorDetails.map(function(ob) {
                return ob.key + ": " + ob.value;
            }).join("\n\n");
        },
    },

    getMailBody: function() {
        return [
            "Mitä tein: ",
            "\n\n",
            "(kirjoita kuvaus tähän)",
            "\n\n",
            "#### Taustatiedot ####",
            "\n\n",
            ErrorMessage.formatError(this.props.error)
        ].join("");
    },

    getMailtoString: function() {
        return (
            "mailto:" + this.mail.to +
            "?subject=" + mailtoEscape(this.mail.subject) +
            "&body=" + mailtoEscape(this.getMailBody())
        );
    },

    render: function() {
        return (
            <div className="ErrorMessage">

                {this.props.customMessage && <h2>{this.props.customMessage}</h2>}

                <p>
                    <a href="" >Lataa sivu uusiksi</a> ja yritä uudelleen. Jos ongelma ei poistu
                    ota yhteyttä puhelimitse tukeen (<a href="tel:014-4591625">014-4591625</a>) tai lähetä tämä virheviesti
                    sähköpostitse suoraan kehitystiimille osoitteeseen dev@opinsys.fi <a href={this.getMailtoString()}>
                        tästä
                    </a>.
                </p>

                <h2>Virheviesti</h2>

                <pre>{this.formatError()}</pre>

            </div>
        );
    }
});


module.exports = ErrorMessage;

/** @jsx React.DOM */
"use strict";

var React = require("react/addons");

function mailtoEscape(value) {
    // borrowed from https://github.com/oncletom/mailto/blob/02aa8796cf6e2a0d66276693bab57e892dd0f7c1/lib/mailto.js#L120
    // fixing *nix line break encoding to follow RFC spec
    return encodeURIComponent(value).replace(/%0A(?!%)/g, '%0D%0A');
}

function objToBody(ob) {
    return Object.keys(ob).map(function(key) {
        return key + ":\n\n" + ob[key] + "\n\n";
    }).join("").trim();
}

/**
 * ErrorMessage
 *
 * @namespace components
 * @class ErrorMessage
 */
var ErrorMessage = React.createClass({

    mail: {
        to: "dev@opinsys.fi",
        subject: "Ongelma tukipalvelussa"
    },

    formatError: function() {
        return objToBody({
            "Virhe": this.props.error.message,
            "Stack": this.props.error.stack,
            "Selain": window.navigator.userAgent,
            "URL": window.location.toString()
        });
    },

    getMailBody: function() {
        return [
            "Mitä tein: ",
            "\n\n",
            "(kirjoita kuvaus tähän)",
            "\n\n",
            "#### Taustatiedot ####",
            "\n\n",
            this.formatError()
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

                {this.props.customMessage && <h3>{this.props.customMessage}</h3>}

                <p>
                    Lataa sivu uusiksi ja yritä uudelleen. Jos ongelma ei poistu
                    ota yhteyttä puhelimitse tukeen tai lähetä tämä virheviesti
                    sähköpostitse suoraan kehitystiimille osoitteeseen dev@opinsys.fi <a href={this.getMailtoString()}>
                        tästä
                    </a>.
                </p>

                <h3>Virheviesti</h3>

                <pre>{this.formatError()}</pre>

            </div>
        );
    }
});


module.exports = ErrorMessage;

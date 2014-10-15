/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var _ = require("lodash");

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

    /**
     * Format the error object to email suitable string
     *
     * @method formatError
     * @return {String}
     */
    formatError: function() {
        var ob = {
            "Selain": window.navigator.userAgent,
            "URL": window.location.toString()
        };

        if (isjQueryAjaxError(this.props.error)) {
             _.extend(ob, {
                "Server error": this.props.error.responseText,
                "Status": this.props.error.status,
                "Status code": this.props.error.statusCode()
            });
        } else {
            _.extend(ob, {
                "Virhe": this.props.error.message,
                "Stack": this.props.error.stack
            });
        }

        return objToBody(ob);
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

                {this.props.customMessage && <h2>{this.props.customMessage}</h2>}

                <p>
                    <a href="" >Lataa sivu uusiksi</a> ja yritä uudelleen. Jos ongelma ei poistu
                    ota yhteyttä puhelimitse tukeen tai lähetä tämä virheviesti
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

/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var Table = require("react-bootstrap/Table");

var app = require("app");
var BackboneMixin = require("app/components/BackboneMixin");
var Fa = require("app/components/Fa");
var captureError = require("app/utils/captureError");
var User = require("app/models/client/User");
var ProfileBadge = require("./ProfileBadge");

/**
 * @namespace components
 * @class ProfileDetails
 * @constructor
 * @param {Object} props
 * @param {models.client.User} props.user
 */
var ProfileDetails = React.createClass({

    mixins: [BackboneMixin],

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
    },

    getInitialState: function() {
        return {
            syncing: false,
            user: this.props.user
        };
    },

    componentDidMount: function() {
        var self = this;
        this.setState({ syncing: true });
        this.state.user.sync()
        .delay(2000)
        .then(function(user) {
            if (!self.isMounted()) return;
            self.setState({ syncing: false });
        })
        .catch(captureError("Käyttäjän haku puavosta epäonnistui"));
    },

    renderPuavoDetails: function() {
        var user = this.state.user;
        if (!user.isPuavoUser()) {
            return <p className="no-puavo">Käyttäjä ei ole Puavo-käyttäjä.</p>;
        }
        var schools = user.getSchools();

        return (
            <div>
                <p>
                    <a href={user.getPuavoEditURL()}>Muokkaa käyttäjää Puavossa</a>
                </p>
                <Table condensed hover>
                    <tbody>
                        <tr>
                            <th>Puavo ID</th>
                            <td>{user.getExternalId()}</td>
                        </tr>
                        <tr>
                            <th>Organisaatio</th>
                            <td>{user.getOrganisationName()}</td>
                        </tr>
                        <tr>
                            <th>Käyttäjätunnus</th>
                            <td>{user.getDomainUsername()}</td>
                        </tr>
                        <tr>
                            <th>Koulut</th>
                            <td>
                                <ul>
                                    {schools.length === 0 && "(ACL:t on vielä rikki)"}
                                    {schools.map(function(school) {
                                        var url = "https://" + user.getOrganisationDomain() + "/users/schools/" + school.id;
                                        return (
                                            <li key={url}>
                                                <a href={url}>{school.name}</a>
                                            </li>
                                        );
                                })}
                                </ul>
                            </td>
                        </tr>
                    </tbody>
                </Table>
            </div>
        );
    },

    render: function() {
        var user = this.state.user;
        var syncing = this.state.syncing;

        return (
            <div className="ProfileDetails">
                <ProfileBadge user={user} size={150} padding={10} />
                <h1>{user.getFullName()}</h1>


                <h2>Yleiset tiedot</h2>

                {syncing && <span>
                    <Fa icon="spinner" spin /> Pävitetään tietoja
                </span>}

                <Table condensed hover>
                    <tbody>
                        <tr>
                            <th>ID</th>
                            <td>{user.get("id")}</td>
                        </tr>
                        <tr>
                            <th>Etunimi</th>
                            <td>{user.getFirstName()}</td>
                        </tr>
                        <tr>
                            <th>Sukunimi</th>
                            <td>{user.getLastName()}</td>
                        </tr>

                        <tr>
                            <th>Pääasiallinen email-osoite</th>
                            <td>{user.getEmail()}</td>
                        </tr>

                        <tr>
                            <th>Vaihtoehtoiset email-osoitteet</th>
                            <td>{user.getAlternativeEmails().join(", ")}</td>
                        </tr>

                    </tbody>
                </Table>

                {app.currentUser.acl.canSeePuavoInfo() && <div>
                    <h2>Puavo tiedot</h2>
                    {this.renderPuavoDetails()}
                </div>}

            </div>
        );
    }

});

module.exports = ProfileDetails;

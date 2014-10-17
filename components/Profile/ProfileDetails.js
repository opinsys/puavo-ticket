/** @jsx React.DOM */
"use strict";

var React = require("react/addons");
var Table = require("react-bootstrap/Table");

var app = require("app");
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

    propTypes: {
        user: React.PropTypes.instanceOf(User).isRequired,
    },

    renderPuavoDetails: function() {
        var user = this.props.user;
        if (!user.isPuavoUser()) {
            return <p className="no-puavo">Käyttäjä ei ole Puavo-käyttäjä.</p>;
        }

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
                                    {user.getSchools().map(function(school) {
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
        var user = this.props.user;

        return (
            <div className="ProfileDetails">
                <ProfileBadge user={user} size={150} padding={10} />
                <h1>{user.getFullName()}</h1>

                <h2>Yleiset tiedot</h2>
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

                {app.currentUser.isManager() && <div>
                    <h2>Puavo tiedot</h2>
                    {this.renderPuavoDetails()}
                </div>}

            </div>
        );
    }

});

module.exports = ProfileDetails;

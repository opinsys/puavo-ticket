"use strict";

function blockUsersWithoutEmail(req, res, next) {
    if (!req.user) return next();
    if (req.user.getEmail()) return next();

    var domain = req.user.getOrganisationDomain();
    var username = req.user.getDomainUsername();
    req.session.destroy();
    res.status(400).send(`<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
        <title>Opinsys tukipalvelu</title>
    </head>
    <body>
        <h1>Aseta sähköpostiosoite</h1>
        <p>
            Opinsys tukipalvelua ei voida käyttää ilman toimivaa
            sähköpostiosoitetta eikä sellaista ole liitetty sinun käyttäjä
            tunnukseesi <b>${username}</b>.

            Aseta itsellesi sähköpostiosoite <a target="_blank" href="https://${domain}/users/profile/edit">tästä linkistä</a>
            ja <a href="">yritä uudelleen</a>.
        </p>

        <p>
            Mikäli ongelma ei poistu ota puhelimitse yhteys tukipalveluumme <b>(014) 4591 625</b>.
        </p>
    </body>
</html>`);

}


module.exports = blockUsersWithoutEmail;

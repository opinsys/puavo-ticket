"use strict";
var Promise = require("bluebird");
var argv = require('minimist')(process.argv.slice(2));
var s = require("underscore.string");

require("app/db");
var Puavo = require("app/utils/Puavo");
var User = require("app/models/server/User");


if (argv.help) {
    console.log("Copy users from puavo-rest to puavo-ticket");
    console.log();
    console.log("Usage ensureUsers.js [organisation domain] <organisation domain ....>");
    process.exit(1);
}

Promise.map(argv._, function(organisationDomain) {
    if (!s.endsWith(organisationDomain, ".opinsys.fi")) {
        organisationDomain += ".opinsys.fi";
    }

    var p = new Puavo({ domain: organisationDomain });
    return p.request("/v3/users")
    .each(function(userData) {
        return User.ensureUserFromJWTToken(userData)
        .catch(User.EmailCollisionError, function(err) {
            console.error("email collision", userData);
        });
    })
    .then(function(users) {
        console.log("Ensured", users.length, "users from", organisationDomain);
        return users.length;
    });
}, {concurrency: 1})
.then(function() {
    process.exit();
})
.catch(function(err) {
    console.log(err.stack);
    process.exit(1);
});

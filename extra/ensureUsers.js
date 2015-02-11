"use strict";
var Promise = require("bluebird");
var argv = require('minimist')(process.argv.slice(2));
var s = require("underscore.string");
var winston = require('winston');
winston.add(winston.transports.File, { filename: 'ensureUsers-' + Date.now() + '.log' });

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
            winston.error("email collision", {user: userData, error: err.message});
        })
        .catch(function(err) {
            winston.error("cannot ensure", {user: userData, error: err.message});
        });
    })
    .then(function(users) {
        winston.info("Users ensured", {
            count: users.length,
            organisation: organisationDomain
        });

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

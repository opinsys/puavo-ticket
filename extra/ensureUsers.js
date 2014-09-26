"use strict";
var Promise = require("bluebird");
var argv = require('minimist')(process.argv.slice(2));

require("app/db");
var Puavo = require("app/utils/Puavo");
var User = require("app/models/server/User");


if (argv.help) {
    console.log("Copy users from puavo-rest to puavo-ticket");
    console.log();
    console.log("Usage ensureUsers.js [organisation domain] <organisation domain ....>");
    process.exit(1);
}

var count = 0;
Promise.map(argv._, function(organisationDomain) {
    var p = new Puavo({ domain: organisationDomain });
    return p.request("/v3/users")
    .map(function(user) {
        count++;
        return User.ensureUserFromJWTToken(user);
    });
})
.then(function() {
    console.log("Ensured", count, "users");
    process.exit();
});

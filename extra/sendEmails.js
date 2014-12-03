"use strict";
var config = require("../config");
var request = require("request");

request.post(
    "http://localhost:" + config.port + "/api/emails/send/" + config.emailJobSecret
).pipe(process.stdout);

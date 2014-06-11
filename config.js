var _ = require("lodash");
var nodemailer = require("nodemailer");

if (typeof window !== "undefined") {
    throw new Error("config.js is not allowed in the browser");
}

var config = {
    database: {
        connection: {
            host: "127.0.0.1",
            user: "puavo-ticket",
            password: "password",
            database: "puavo-ticket"
        }
    },
    puavo: {},
    directory: "./migrations",
    tableName: "migrations"
};

config.emailTransport = nodemailer.createTransport("stub", {error: false});

if (process.env.NODE_ENV === "test") {
    config.database.connection = {
        host: "127.0.0.1",
        user: "puavo-ticket",
        password: "password",
        database: "puavo-ticket-test"
    };
    config.puavo.restServerAddress = "https://testing.opinsys.fi";
    config.puavo.sharedSecret = "secret";
    config.puavo.username = "puavo-ticket";
    config.puavo.password = "password";
    // FIXME: use one user for all organisations (o=puavo)
    config.puavo.organisations = {
        "testing.opinsys.fi": {
            "username": "puavo-ticket",
            "password": "password"
        }
    };

    config.managerOrganisationDomain = "managertesting.opinsys.net";

} else {

    var productionConfig = require("./_config");
    config = _.extend(config, productionConfig);

    if (productionConfig.smtp) {
        config.emailTransport = nodemailer.createTransport(
            "SMTP",
            productionConfig.smtp
        );
    } else {
        console.warn("'smtp' config is missing from _config.json. Email sending is disabled.");
    }


    if (!config.puavo.sharedSecret) {
        throw new Error('"sharedSecret" is missing from _config.json');
    }
}

config.database.debug = !!process.env.SQL;
config.database.client = "pg";

module.exports = config;

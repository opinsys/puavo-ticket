var _ = require("lodash");
var nodemailer = require("nodemailer");
var stubTransport = require("nodemailer-stub-transport");
var smtpTransport = require("nodemailer-smtp-transport");

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
    tableName: "migrations",
    redis: {}
};


if (process.env.NODE_ENV === "test") {
    config.database.connection = {
        host: "127.0.0.1",
        user: "puavo-ticket",
        password: "password",
        database: "puavo-ticket-test"
    };
    config.puavo.restServerAddress = "https://test-api.opinsys.example";
    config.puavo.sharedSecret = "secret";
    config.puavo.username = "puavo-ticket";
    config.puavo.password = "password";
    config.managerOrganisationDomain = "managertesting.opinsys.net";
    config.sessionSecret = "secret";

} else {
    var productionConfig = require("./_config");
    config = _.extend(config, productionConfig);

    if (!config.puavo.sharedSecret) {
        throw new Error('"sharedSecret" is missing from _config.json');
    }
}

config.database.debug = !!process.env.SQL;
config.database.client = "pg";

if (!config.sessionSecret) {
    throw Error("sessionSecret is missing from the configuration!");
}

if (config.smtp) {
    config.mailTransport = nodemailer.createTransport(smtpTransport(config.smtp));
} else {
    console.warn("'smtp' config is missing from config. Email sending is disabled.");
    config.mailTransport = nodemailer.createTransport(stubTransport());
}
module.exports = config;

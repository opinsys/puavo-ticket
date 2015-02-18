require("./babel-register");
var _ = require("lodash");
var winston = require("winston");
var nodemailer = require("nodemailer");
var stubTransport = require("nodemailer-stub-transport");
var smtpTransport = require("nodemailer-smtp-transport");

if (typeof window !== "undefined") {
    throw new Error("config.js is not allowed in the browser");
}

var config = {
    logpath: __dirname + "/log/production.json.log",
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

var productionConfig = null;
try {
    productionConfig = require("./_config");
} catch(err) {
    if (err.code !== "MODULE_NOT_FOUND") throw err;
    productionConfig = require("/etc/puavo-ticket/config");
}

if (process.env.NODE_ENV === "test" || process.env.ACCEPTANCE) {
    winston.remove(winston.transports.Console);
    config.database.connection = {
        host: "127.0.0.1",
        user: "puavo-ticket",
        password: "password",
        database: "puavo-ticket-test"
    };

    if (process.env.ACCEPTANCE) {
        config.logpath =  __dirname + "/log/acceptance.json.log";
    } else {
        config.logpath =  __dirname + "/log/test.json.log";
    }

    config.domain = "support.opinsys.net";
    config.puavo.restServerAddress = "https://test-api.opinsys.example";
    config.puavo.sharedSecret = "secret";
    config.puavo.username = "puavo-ticket";
    config.puavo.password = "password";
    config.managerOrganisationDomain = "managertesting.opinsys.net";
    config.sessionSecret = "secret";
    config.emailJobSecret = "secret";
    config.emailReplyDomain = "opinsys.example";
    config.mailGunSecret = "secret";
    config.forwardTicketsEmail = "new-tickets@opinsys.example";

    if (process.env.ACCEPTANCE) {
         config.port = productionConfig.port;
         config.domain = productionConfig.domain;
         config.restServerAddress = productionConfig.restServerAddress;
         config.managerOrganisationDomain = productionConfig.managerOrganisationDomain;
         config.puavo = productionConfig.puavo;
    }

} else {
    config = _.extend(config, productionConfig);

    if (!config.puavo.sharedSecret) {
        throw new Error('"sharedSecret" is missing from _config.json');
    }
}

config.database.debug = !!process.env.SQL;
config.database.client = "pg";

if (!config.sessionSecret) {
    throw new Error("config.sessionSecret is not set");
}

if (!config.emailJobSecret) {
    // Used for the buffered email sending api. See resources/emails.js
    throw new Error("config.emailJobSecret is not set");
}

if (!config.emailReplyDomain) {
    throw new Error("config.emailReplyDomain is not set");
}

if (!config.mailGunSecret) {
    throw new Error("config.mailGunSecret is not set");
}

if (!config.forwardTicketsEmail) {
    throw new Error("config.forwardTicketsEmail is not set");
}

if (config.smtp) {
    config.mailTransport = nodemailer.createTransport(smtpTransport(config.smtp));
} else {
    console.warn("'smtp' config is missing from config. Email sending is disabled.");
    config.mailTransport = nodemailer.createTransport(stubTransport());
}

if (process.env.PORT) {
    config.port = process.env.PORT;
}

module.exports = config;

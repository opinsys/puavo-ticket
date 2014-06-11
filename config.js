var _ = require("lodash");

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
    config = _.extend(config, require("./_config"));
    if (!config.puavo.sharedSecret) {
        throw new Error('"sharedSecret" is missing from _config.json');
    }
}

config.database.debug = !!process.env.SQL;
config.database.client = "pg";

module.exports = config;

var _ = require("lodash");

var config = {
    database: {
        connection: {
            host: "127.0.0.1",
            user: "puavo-ticket",
            password: "password",
            database: "puavo-ticket"
        }
    },
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
    config.puavo = {};
    config.puavo.sharedSecret = "secret";
    config.puavo.protocol = "https://";
    config.puavo.user = "puavo-ticket";
    config.puavo.password = "password";
    // FIXME: use one user for all organisations (o=puavo)
    config.puavo.organisations = {
        "testing.opinsys.fi": {
            "user": "puavo-ticket",
            "password": "password"
        }
    };
} else {
    config = _.extend(config, require("./_config"));
    if (!config.puavo.sharedSecret) {
        throw new Error('"sharedSecret" is missing from _config.json');
    }
}

config.database.debug = !!process.env.SQL;
config.database.client = "pg";

module.exports = config;

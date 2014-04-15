var _ = require("lodash");

var config = {
    database: {
        debug: false,
        client: "sqlite3"
    },
    directory: "./migrations",
    tableName: 'migrations'
};

if (process.env.NODE_ENV === "test") {
    config.puavoSharedSercret = "secret";
    config.database.connection = {
        filename: ".puavo-ticket.db"
    };
} else {
    config = _.extend(config, require("./_config"));
    config.database.connection = {
        filename: ".test.db"
    };
}

module.exports = config;

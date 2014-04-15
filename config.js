var _ = require("lodash");

var config = {
    database: {
        debug: false,
        client: "sqlite3",
        connection: {
            filename: "book.db"
        }
    },
    directory: "./migrations",
    tableName: 'migrations'
};

config = _.extend(config, require("./_config"));

if (process.env.NODE_ENV === "test") {
    config.puavoSharedSercret = "secret";
}

module.exports = config;

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

module.exports = _.extend(config, require("./_config"));

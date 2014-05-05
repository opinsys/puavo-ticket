var _ = require("lodash");

var config = {
    database: {
        debug: false,
        client: "pg"
    },
    directory: "./migrations",
    tableName: 'migrations'
};

if (process.env.NODE_ENV === "test") {
    config.puavoSharedSecret = "secret";
    config.database.connection = {
        host     : '127.0.0.1',
        user     : 'puavo-ticket',
        password : 'test',
        database : 'puavo-ticket-test'
    };
} else {
    config = _.extend(config, require("./_config"));
    if (!config.puavoSharedSecret) {
        throw new Error('"puavoSharedSecret" is missing from _config.json');
    }
    config.database.connection = {
        filename: ".puavo-ticket.db"
    };
}


module.exports = config;

var config = require("./config");

// knexfile file was introduced in knex 0.6.0. We already have an environment
// specific configurations in config.js. So just pass in the configs.

module.exports = {
    test: config.database,
    development: config.database,
    production: config.database
};

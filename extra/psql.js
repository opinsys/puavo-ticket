
var kexec = require("kexec");

var config = require("app/config");

process.env.PGPASSWORD = config.database.connection.password;

kexec("psql", [
    "-U", config.database.connection.user,
    "-h",  config.database.connection.host,
    config.database.connection.database
]);


require("./db");
var browserify = require("browserify-middleware");
var express = require("express");
var Ticket = require("./models/Ticket");

var app = express();

app.use(express.static(__dirname));

app.get("/bundle.js", browserify("./client.js", {
    transform: ["reactify"]
}));


app.get("/api/tickets", function(req, res) {
    Ticket.collection().fetch().then(function(coll) {
        res.json(coll.toJSON());
    });
});

app.get("/*", function(req, res) {
    res.sendfile(__dirname + "/views/index.html");
});

module.exports = app;

if (require.main === module) {
    var server = app.listen(3000, function() {
        console.log('Listening on port %d', server.address().port);
    });
}

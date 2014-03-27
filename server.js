
var browserify = require("browserify-middleware");
var express = require("express");

var app = express();


app.get("/bundle.js", browserify("./client.js", {
    transform: ["reactify"]
}));

app.use(express.static(__dirname));

app.get("/*", function(req, res) {
    res.sendfile(__dirname + "/index.html");
});


var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});

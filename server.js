
var browserify = require("browserify-middleware");
var express = require("express");

var app = express();


app.get("/bundle.js", browserify("./client.js", {
    transform: ["reactify"]
}));

app.use(express.static(__dirname));

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port);
});

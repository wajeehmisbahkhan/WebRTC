console.log("Server is starting...");

var express = require('express');

var app = express();

var server = app.listen(3000, started);

function started () {
    console.log("Server has started listening.");
}

app.use(express.static('public'));
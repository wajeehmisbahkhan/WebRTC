console.log("Server is starting...");

var express = require('express');

var app = express();

var server = app.listen(3000, started);

function started () {
    console.log("Server has started listening.");
}

app.use(express.static('public'));

var socket = require('socket.io');

var io = socket(server);

io.on("connection", newConnection);

var ids = [];

function newConnection (socket) {
    console.log("New Connection: " + socket.id);
    socket.emit('load previous users', ids);
    socket.emit('set user id', socket.id);
    ids.push(socket.id);
    socket.broadcast.emit('user came', socket.id);
    //Disconnect
    socket.on('disconnect', function () {
        console.log(socket.id + " left.");
        //Remove from Array
        var search_term = socket.id;
        for (var i=ids.length-1; i>=0; i--) {
            if (ids[i] === search_term) {
                ids.splice(i, 1);
                break;
            }
        }
        //Broadcast to other users
        socket.broadcast.emit('user left', socket.id);
    });
    //Calling
    socket.on('calling', generateResponse);
    //Respond
    socket.on('responded', connectClients);
}

function generateResponse (data, callIds) {
    io.to(callIds.otherId).emit('recieving call', data, callIds.myId);
}

function connectClients (response, caller) {
    io.to(caller).emit('call recieved', response);
}
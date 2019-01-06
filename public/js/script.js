var callIds = {
    callerId: '',
    calleeId: ''
}

var socket = io.connect('http://localhost:3000');

socket.on('user came', addUser);
socket.on('set user id', setId);
socket.on('user left', removeUser);
socket.on('load previous users', addCurrentUsers);
socket.on('recieving call', respond);
socket.on('call recieved', startCall);

function addCurrentUsers (ids) {
    ids.forEach(id => {
        addUser(id);
    });
}

function addUser (id) {
    var userElement = '<div class="user" id="'+ id + '"><div class="info"><p>'+ id+'</p></div><div class="call"><button>Call</button></div></div>';
    $("body").append(userElement);
    $('button').click(callPerson);
}

function removeUser (id) {
    var user = $("body").find('div#'+id);
    user.remove();
}

function setId (id) {
    callIds.callerId = id;
}

//WEBRTC STUFF
var peer = new SimplePeer({
    trickle: false
});

function callPerson (e) {
    //Add a basic video and screen place to the body
    e.preventDefault();
    var id = $(this).parent().parent().attr('id');
    callIds.calleeId = id;
    $('body').html('<p>Calling...</p>');
    //Get the User Media
    navigator.mediaDevices.getUserMedia({
        video: {
            width: {max: 1920},
            height: {max: 1080},
            frameRate: {max: 10},
            mediaStreamSource: {exact: ['desktop']}
          },
        audio: true
    }).then(function (stream) {
        peer.initiator = true;
        peer.stream = stream;

        peer.on('signal', function (data) { //Fired by Initiator
            socket.emit('calling', data, callIds.calleeId);
        });

        peer.on('stream', function (stream) {
            var video = document.createElement('video');
            document.body.appendChild(video);
            video.srcObject = stream;
            video.play();
        });
    
        }).catch(function (err) {
            console.log(err);
        });

}

function respond (data) {
    //Add a basic video and screen place to the body
    $('body').html('<p>Connecting to a caller...</p>');
    //WebRTC Stuff
    navigator.mediaDevices.getUserMedia({
        video: {
            width: {max: 1920},
            height: {max: 1080},
            frameRate: {max: 10},
            mediaStreamSource: {exact: ['desktop']}
          },
        audio: true
    }).then(function (stream) {
    
        peer.initiator = false;
        peer.stream = stream;
    
        peer.signal(data); //Creates a response


        peer.on('signal', function (response) {
            socket.emit('responded', response, callIds.callerId);
        });

        peer.on('stream', function (stream) {
            var video = document.createElement('video');
            document.body.appendChild(video);
            video.srcObject = stream;
            video.play();
        })

        }).catch(function (err) {
            console.log(err);
        });
}

function startCall (response) {

}
var callIds = {
    myId: '',
    otherId: ''
};

var i = 0;

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
    callIds.myId = id;
}

//WEBRTC STUFF
var peer;

function callPerson (e) {
    //Add a basic video and screen place to the body
    e.preventDefault();
    var id = $(this).parent().parent().attr('id');
    callIds.otherId = id;
    $('body').html('<p>Calling...</p>');
    //Get the User Media
    navigator.mediaDevices.getUserMedia({
        video: {
            width: {max: 1920},
            height: {max: 1080},
            frameRate: {max: 10},
            mediaStreamSource: {exact: ['desktop']}
          },
        audio: false
    }).then(function (stream) {
        peer = new SimplePeer({
            initiator: true,
            trickle: false,
            stream: stream
        });

        peer.on('signal', function (data) { //Fired by Initiator
            if (i == 0) {
                i++;
                socket.emit('calling', data, callIds);
            }
        });

        peer.on('data', function (msg) {
            console.log(msg);
        })

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

function respond (data, otherId) {
    callIds.otherId = otherId;
    //Add a basic video and screen place to the body
    $('body').html('<p>Connecting to a caller...</p>');
    //WebRTC Stuff
    navigator.mediaDevices.getUserMedia({
        // video: {
        //     width: {max: 1920},
        //     height: {max: 1080},
        //     frameRate: {max: 10},
        //     mediaStreamSource: {exact: ['desktop']}
        //   },
        audio: true
    }).then(function (stream) {

        peer = new SimplePeer({
            initiator: false,
            trickle: false,
            stream: stream
        });

        peer.signal(data);

        peer.on('signal', function (response) {
            console.log(response);
            socket.emit('responded', response, callIds.otherId);
        })

        peer.on('data', function (msg) {
            console.log(msg);
        })

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
    console.log(response);
    peer.signal(response);
}